import { DyadLexer } from "./dyad_lexer.js";
import { formatDyad, lexTokenType, parseExpr } from "./parse.js";

describe("Parsing and Lexing tests", () => {
  test("Check for token type of string", () => {
    const lexResult = DyadLexer.tokenize("constant identifier end 100");
    expect(lexResult.tokens).toHaveLength(4);
    expect(lexResult.tokens[0].tokenType.name).toEqual("Constant");
    expect(lexResult.tokens[1].tokenType.name).toEqual("Identifier");
    expect(lexResult.tokens[2].tokenType.name).toEqual("End");
    expect(lexResult.tokens[3].tokenType.name).toEqual("NumberLiteral");
  });

  test("Token type function", () => {
    expect(lexTokenType("constant")).toEqual("Constant");
    expect(lexTokenType("foobar")).toEqual("Identifier");
    expect(lexTokenType("foo bar")).toEqual(null);
    expect(lexTokenType("1foo")).toEqual(null);
  });

  test("Test expression parsing", () => {
    const works = parseExpr("a*b");
    expect(works.hasValue()).toEqual(true);
    expect(works.hasProblems()).toEqual(false);
    works.ifResult((value) => {
      expect(value.type).toEqual("bexp");
      if (value.type === "bexp") {
        expect(value.op).toEqual("*");
      }
      expect(value).toMatchSnapshot();
    }, []);

    const error = parseExpr("f(--, a)");
    expect(error.hasProblems()).toEqual(true);
  });

  test("Test formatting", () => {
    const formatted = formatDyad(`
  component    Hello  
  parameter x :: Real =    5
end`);
    expect(formatted.hasValue()).toEqual(true);
    if (formatted.hasValue()) {
      expect(formatted.value).toEqual(`component Hello
  parameter x::Real = 5
end`);
    }
  });
});
