import type {
  ILexingError,
  IRecognitionException,
  IToken,
  Rule,
} from "chevrotain";
import { DyadParser } from "./dyad_parser.js";
import { ExpressionCstNode, FileCstNode } from "./dyad_cst.js";
import { DyadLexer } from "./dyad_lexer.js";
import {
  bundledProblems,
  failedResult,
  Nullable,
  partialResult,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  Expression,
  FileKey,
  sourceKey,
  TextProblem,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import { AstBuilder } from "../builder/ast_builder.js";
import { unparseDyad } from "./unparse.js";
import { formatDyadError } from "./error_formatter.js";

// reuse the same parser instance.
const parser = new DyadParser();
export const BaseDyadVisitorWithDefaults =
  parser.getBaseCstVisitorConstructorWithDefaults();

export const productions: Record<string, Rule> = parser.getGAstProductions();

export interface ParsingResult {
  cst: FileCstNode;
  tokens: IToken[];
  lexErrors: TextProblem[];
  parseErrors: TextProblem[];
}

export function lexTokenType(token: string): null | string {
  try {
    const lexResult = DyadLexer.tokenize(token);
    if (lexResult.tokens.length > 1) {
      return null;
    }
    return lexResult.tokens[0].tokenType.name;
  } catch {
    return null;
  }
}

/**
 * This function parses an expression and returns it as a `Result`
 * @param text Text containing an expression
 * @param filePath Optional path to the file for error reporting
 * @returns a `Result<Expression>` instance
 */
export function parseExpr(text: string, filePath: Nullable<string> = null): Result<Expression> {
  const lexResult = DyadLexer.tokenize(text);
  const effectiveFilePath = filePath || "<expression>";

  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens;
  let cst: ExpressionCstNode | undefined;
  let parseErrors: TextProblem[] = [];

  try {
    // Clear previous errors before a new parse attempt with this parser instance
    parser.errors = []; 
    cst = parser.expression() as ExpressionCstNode;
    // Collect parser errors after attempting to parse
    parseErrors = parser.errors.map((e) => parse2problem(e, filePath ? sourceKey(effectiveFilePath, []) : null, text, effectiveFilePath));
  } catch (e) {
    // This catch block might not be strictly necessary if Chevrotain errors are always collected in parser.errors
    // However, it can catch unexpected issues during parsing.
    // For now, we rely on parser.errors which are populated by Chevrotain
    console.error("Unexpected error during expression parsing attempt:", e);
    // Ensure parser.errors is checked even if an exception occurs outside Chevrotain's normal error collection
    if (parser.errors.length > 0 && parseErrors.length === 0) {
        parseErrors = parser.errors.map((e) => parse2problem(e, filePath ? sourceKey(effectiveFilePath, []) : null, text, effectiveFilePath));
    }
  }

  const lexErrors = lexResult.errors.map((e) => lex2problem(e, filePath ? sourceKey(effectiveFilePath, []) : null, text, effectiveFilePath));
  const problems: Problem[] = [...lexErrors, ...parseErrors];

  const builder = new AstBuilder();

  if (parser.errors.length > 0 || lexResult.errors.length > 0 || cst === undefined) {
      // If there are problems, format the first one for a more detailed primary error message
      // The `details` field of TextProblem will now contain the formatted, contextual error.
      if (problems.length > 0) {
        return failedResult(problems[0], ...problems.slice(1));
      }
      // This case implies cst is undefined but no lex/parse errors were formally collected into `problems`.
      // Create a generic problem for this unusual situation.
      const genericProblem: TextProblem = {
          severity: "error",
          type: "parse-error",
          title: "Unknown Parsing Error",
          instance: effectiveFilePath,
          details: formatDyadError(text, effectiveFilePath, "Unknown Parsing Error", "Parsing failed and no specific errors were collected. CST not generated.", {startLine:1, startColumn:1, image:""} as IToken),
          extra: { file: filePath ? sourceKey(effectiveFilePath, []) : null, span: {sl:1, sc:1, el:1, ec:1} }
      };
      return failedResult(genericProblem);
  }

  const ast = builder.expression(cst.children, undefined);
  return partialResult(ast, ...problems); // partialResult if there are only warnings, but here they are errors
}

// Consolidate DocLine tokens into a single token.  This is necessary because I cannot
// get the Chevrotain lexer to consume the line feeds in the case of a multiple comments
// and keeping them as multiple tokens creates complications in the parser. So consolidating
// them here (into a single token) is the simplest solution I can think of.
function consolidateTokens(
  text: string
): { tokens: IToken[], lexErrorsRaw: ILexingError[] } {
  const lexResult = DyadLexer.tokenize(text);
  const tokens = lexResult.tokens.reduce((ts: IToken[], token: IToken) => {
    if (ts.length === 0) {
      return [token];
    }
    const last = ts.at(-1);
    if (
      last &&
      last.tokenType.name === "DocLine" &&
      token.tokenType.name === "DocLine"
    ) {
      const merged: IToken = {
        endColumn: token.endColumn,
        endLine: token.endLine,
        endOffset: token.endOffset,
        image: last.image + token.image,
        startColumn: last.startColumn,
        startLine: last.startLine,
        startOffset: last.startOffset,
        tokenType: last.tokenType,
        tokenTypeIdx: last.tokenTypeIdx,
      };
      return [...ts.slice(0, -1), merged];
    }
    return [...ts, token];
  }, []);

  return { tokens, lexErrorsRaw: lexResult.errors };
}

export function formatDyad(text: string): Result<string> {
  const { tokens, lexErrorsRaw } = consolidateTokens(text);
  const instancePath = "<format>"; // Instance name for formatting context
  const fileKey = sourceKey(instancePath, []);

  const lexErrors = lexErrorsRaw.map((e) => lex2problem(e, fileKey, text, instancePath));

  // Clear previous errors before a new parse attempt
  parser.errors = []; 
  parser.input = tokens;
  const cst = parser.file() as FileCstNode;
  
  const parseErrors = parser.errors.map((e) =>
    parse2problem(e, fileKey, text, instancePath)
  );
  const problems: Problem[] = [...lexErrors, ...parseErrors];
  if (problems.length > 0) {
    return failedResult(problems[0], ...problems.slice(1));
  }

  const builder = new AstBuilder();
  const ast = builder.file(cst.children, {
    provider: "formatter",
    file: fileKey,
  });
  return successfulResult(unparseDyad(ast));
}

export function parseDyad(
  text: string,
  instance: string, // This is often the file path or a descriptor
  file: Nullable<FileKey> // Retained for compatibility, but instance can serve as filePath
): ParsingResult {
  const { tokens, lexErrorsRaw } = consolidateTokens(text);
  const filePath = instance; // Assuming instance is the file path for error reporting

  const lexErrors = lexErrorsRaw.map((e) => lex2problem(e, file, text, filePath));
  
  // Clear previous errors before a new parse attempt
  parser.errors = []; 
  parser.input = tokens;
  const cst = parser.file() as FileCstNode;
  const parseErrorsResult = parser.errors.map((e) => parse2problem(e, file, text, filePath));

  return {
    cst: cst,
    tokens: tokens,
    lexErrors,
    parseErrors: parseErrorsResult,
  };
}

function lex2problem(
  p: ILexingError,
  file: Nullable<FileKey>,
  sourceCode: string,
  filePath: string
): TextProblem {
  const errorTitle = "Lexical Error";
  const span: TextualSpan = {
    sl: normalizeIndex(p.line, 1),
    sc: normalizeIndex(p.column, 1),
    el: normalizeIndex(p.line, 1),
    ec: normalizeIndex(p.column, 0) + p.length,
  };

  const dummyToken: IToken = {
      image: sourceCode.substring(p.offset, p.offset + p.length),
      startOffset: p.offset,
      startLine: p.line,
      startColumn: p.column,
      endLine: p.line,
      endColumn: (p.column || 0) + p.length -1,
      tokenType: { name: "LEXER_ERROR" } as any,
      tokenTypeIdx: NaN
  };

  const details = formatDyadError(sourceCode, filePath, errorTitle, p.message, dummyToken);

  return {
    severity: "error",
    type: "lex-error",
    title: errorTitle,
    instance: filePath,
    details: details,
    extra: { file, span },
  };
}

function normalizeIndex(idx: number | undefined | null, d: number): number {
  if (idx === undefined || idx === null || Number.isNaN(idx)) {
    return d;
  }
  return idx;
}

function parse2problem(
  p: IRecognitionException,
  file: Nullable<FileKey>,
  sourceCode: string,
  filePath: string
): TextProblem {
  const errorTitle = "Parsing Error";
  const sl = normalizeIndex(p.token.startLine, 1);
  const sc = normalizeIndex(p.token.startColumn, 1);
  const span: TextualSpan = {
    sl: sl,
    sc: sc,
    el: normalizeIndex(p.token.endLine, sl),
    ec: normalizeIndex(p.token.endColumn, sc),
  };

  const details = formatDyadError(sourceCode, filePath, errorTitle, p.message, p.token);
  
  return {
    severity: "error",
    type: "parse-error",
    title: errorTitle,
    instance: filePath,
    details: details,
    extra: { file, span },
  };
}
