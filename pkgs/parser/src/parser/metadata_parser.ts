import type { Rule } from "chevrotain";
import {
  BooleanLiteral,
  Colon,
  Comma,
  LCurly,
  LSquare,
  Null,
  AddOp,
  NumberLiteral,
  RCurly,
  RSquare,
  StringLiteral,
  allTokens,
} from "./dyad_tokens.js";
import { DyadLexer } from "./dyad_lexer.js";
import { ObjectCstNode } from "./dyad_cst.js";
import { DyadParser } from "./dyad_parser.js";

import { CstParser } from "chevrotain";

export function addJson(this: MetadataParser) {
  const json = this.RULE("json", () => {
    this.OR([
      // using ES6 Arrow functions to reduce verbosity.
      { ALT: () => this.SUBRULE(object) },
      { ALT: () => this.SUBRULE(array) },
    ]);
  });

  // example for private access control
  const object = this.RULE("object", () => {
    this.CONSUME(LCurly);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE2(objectItem);
      },
    });
    this.CONSUME(RCurly);
  });

  const objectItem = this.RULE("objectItem", () => {
    this.CONSUME(StringLiteral);
    this.CONSUME(Colon);
    this.SUBRULE(value);
  });

  const array = this.RULE("array", () => {
    this.CONSUME(LSquare);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(value);
      },
    });
    this.CONSUME(RSquare);
  });

  const value = this.RULE("value", () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      {
        ALT: () => {
          this.OPTION(() => this.CONSUME(AddOp, { LABEL: "prefix" }));
          this.CONSUME(NumberLiteral);
        },
      },
      { ALT: () => this.SUBRULE(object) },
      { ALT: () => this.SUBRULE(array) },
      { ALT: () => this.CONSUME(BooleanLiteral) },
      { ALT: () => this.CONSUME(Null) },
    ]);
  });

  return object;
}

export class MetadataParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public object = addJson.bind(this)();
}

export function jsonProductions() {
  const parser = new MetadataParser();
  const productions: Record<string, Rule> = parser.getGAstProductions();
  return productions;
}

export function parseMetadata(text: string) {
  const parser = new MetadataParser();
  const lexResult = DyadLexer.tokenize(text);

  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens;
  // any top level rule may be used as an entry point
  const cst = parser.object() as ObjectCstNode;

  return {
    // This is a pure grammar, the value will be undefined until we add embedded actions
    // or enable automatic CST creation.
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
}
