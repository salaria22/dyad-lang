import { Children, childArray } from "./children.js";
import { Definition } from "./definitions.js";
import { SourceKey } from "./keys.js";
import { ASTNode } from "./node.js";
import { UsingStatement } from "./using.js";
import { TextProblem } from "./span.js";

/**
 * Information associated with a file that was successfully parsed.
 *
 * @category AST Nodes
 */
export interface ParsedFile {
  kind: "file";
  /** The UUID of the provider that supplied this file */
  provider: string;
  /**
   * Where the parsed text came from.  This is not the contents of that file but
   * rather a name or URI.
   */
  source: SourceKey;
  /** Any using statements that are in scope for this file */
  uses: UsingStatement[];
  /**
   * Each definition "knows" what file it came from by virtue of what
   * FileContents node it belongs to.  I also need to include additional textual
   * information (start and end position) both for highlighting semantic errors
   * as well as reconstructing individual files (e.g., definition order).
   */
  definitions: Definition[];
}

/**
 * This is a type to represent anything that could be contained at the top level
 * of a file.  All types that satisfy this have a `source` field of type
 * `Nullable<SourceKey>`.  Adding this to `FileLevelNode`s means we don't need
 * to backtrack up the AST just to find out what file a declaration is in and
 * this will make error reporting SO MUCH EASIER because we almost always have
 * an instance of a `FileLevelNode` in hand when we create errors but we almost
 * never have the `FileNode`.
 **/
export type FileLevelNode = Definition | UsingStatement;

/**
 * Constructor used to build an instance of `ParsedFile`
 *
 * @category AST Nodes
 * @param provider
 * @param source
 * @param uses
 * @param definitions
 * @returns
 */
export function parsedFile(
  provider: string,
  source: SourceKey,
  uses: UsingStatement[],
  definitions: Definition[]
): ParsedFile {
  return {
    kind: "file",
    provider,
    source,
    uses,
    definitions,
  };
}

/**
 * List the children of a `ParsedFile` node
 *
 * @category Navigation
 * @param file
 * @returns
 */
export function parsedFileChildren(file: ParsedFile): Children {
  return { ...childArray("uses", file), ...childArray("definitions", file) };
}

/** Predicate that indicates if a given `ASTNode` is an instance of `ParsedFile`
 *
 * @category Type Predicates
 **/
export function isParsedFile(node: ASTNode | null): node is ParsedFile {
  return node !== null && node.kind === "file";
}

/**
 * This node is used to represent a file that could not be parsed.  This
 * preserves the contents of the file so it survives "round-tripping". It also
 * includes information about the problems that were found when parsing was
 * attempted on the file contents.
 *
 * @category AST Nodes
 */
export interface RawFile {
  kind: "raw";
  /** The UUID of the provider that supplied this file */
  provider: string;
  /**
   * Where the parsed text came from.  This is not the contents of that file but
   * rather a name or URI.
   */
  source: SourceKey;
  /**
   * The actual bytes that were in the file (and could not be parsed).
   */
  content: string;
  /**
   * The problems encountered when the contents were parsed.
   */
  problems: TextProblem[];
}

/**
 * Constructor used to build an instance of `RawFile`
 *
 * @category AST Nodes
 * @param provider
 * @param source
 * @param content
 * @param problems
 * @returns
 */
export function rawFile(
  provider: string,
  source: SourceKey,
  content: string,
  problems: TextProblem[]
): RawFile {
  return {
    kind: "raw",
    provider,
    source,
    content,
    problems,
  };
}

/**
 * List the children of a `RawFile` node
 *
 * @category Navigation
 * @param file
 * @returns
 */
export function rawFileChildren(file: RawFile): Children {
  return {};
}

/** Predicate that indicates if a given `ASTNode` is an instance of `RawFile`
 *
 * @category Type Predicates
 **/
export function isRawFile(node: ASTNode | null): node is RawFile {
  return node !== null && node.kind === "raw";
}

/** List of all possible files
 *
 * @category AST Nodes
 */
export type FileContents = ParsedFile | RawFile;

/** Predicate indicating whether a given `ASTNode` is an instance of `FileContents`
 *
 * @category Type Predicates
 **/
export function isFileContents(x: ASTNode | null): x is FileContents {
  return isParsedFile(x) || isRawFile(x);
}
