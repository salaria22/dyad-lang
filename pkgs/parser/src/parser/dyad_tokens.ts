import type { CustomPatternMatcherFunc, ITokenConfig } from "chevrotain";

import * as chevrotain from "chevrotain";

export const allTokens: ITokenConfig[] = [];

function add(token: ITokenConfig): ITokenConfig {
  allTokens.push(token);
  return token;
}

function wrap(regex: RegExp): CustomPatternMatcherFunc {
  return (text: string, offset: number): RegExpExecArray | null => {
    const re = new RegExp(regex, "y");
    re.lastIndex = offset;
    return re.exec(text);
  };
}

export const Identifier = chevrotain.createToken({
  name: "Identifier",
  // pattern: wrap(/(?<=\[['"])[\w. -]{1,1024}(?=['"]\])/), // Wrap the modern ECMAScript RegExp syntax in the function
  pattern: (text: string, offset: number): RegExpExecArray | null => {
    const sub = text.slice(offset);
    // const sub = text;
    const re =
      /[\p{L}\p{Extended_Pictographic}][\p{L}\p{Extended_Pictographic}\p{No}0-9_]*/u;
    // re.lastIndex = offset;
    const match = re.exec(sub);
    return match;
  },
  line_breaks: false, // A Custom Token Pattern should specify the <line_breaks> option
});

add(
  chevrotain.createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.Lexer.SKIPPED,
  })
);

export const DocLine = add(
  chevrotain.createToken({
    name: "DocLine",
    pattern: /#(?:[^\n\r])*(?:[\n\r])/,
    line_breaks: true,
  })
);

function keyword(name: string, ...alts: chevrotain.TokenType[]) {
  return add(
    chevrotain.createToken({
      name,
      pattern: name.toLowerCase(),
      longer_alt: Identifier,
    })
  );
}

function operator(
  name: string,
  pattern: string | RegExp,
  longer?: ITokenConfig
) {
  return add(
    chevrotain.createToken({
      name,
      pattern: pattern,
      longer_alt: longer,
    })
  );
}

export const Input = keyword("Input"); // qualifier
export const Initial = keyword("Initial"); // component keyword
export const In = keyword("In", Input, Initial); // control keyword
export const For = keyword("For"); // control keyword
export const Type = keyword("Type"); // component keyword
export const Using = keyword("Using"); // control keyword
export const Connector = keyword("Connector"); // component keyword
export const End = keyword("End"); // component keyword
export const Potential = keyword("Potential"); // qualifier
export const Flow = keyword("Flow"); // qualifier
export const Stream = keyword("Stream"); // qualifier
export const Path = keyword("Path"); // qualifier
export const Continuity = keyword("Continuity"); // function
export const Partial = keyword("Partial"); // qualifier
export const Final = keyword("Final"); // qualifier
export const External = keyword("External"); // qualifier
export const Test = keyword("Test"); // qualifier
export const Example = keyword("Example"); // qualifier
export const Component = keyword("Component"); // component keyword
export const AnalysisPoint = keyword("Analysis_point"); // function
export const Analysis = keyword("Analysis"); // component keyword
export const Metadata = keyword("Metadata"); // component keyword
export const Extends = keyword("Extends"); // component keyword
export const Relations = keyword("Relations"); // component keyword
export const Assert = keyword("Assert"); // function
export const Connect = keyword("Connect"); // function
export const Transition = keyword("Transition"); // function
export const State = keyword("State"); // component keyword
export const Switch = keyword("Switch"); // control keyword
export const Case = keyword("Case"); // control keyword
export const Default = keyword("Default"); // control keyword

export const Structural = keyword("Structural"); // qualifier
export const Parameter = keyword("Parameter"); // qualifier
export const Constant = keyword("Constant"); // qualifier
export const Variable = keyword("Variable"); // qualifier
export const Output = keyword("Output"); // qualifier
export const Enum = keyword("Enum"); // component qualifier
export const Func = keyword("Func"); // component qualifier
export const Struct = keyword("Struct"); // component qualifier

export const Pipe = operator("Pipe", "|");
export const DoubleColon = operator("DoubleColon", "::");
export const Colon = operator("Colon", ":", DoubleColon);
export const Comma = operator("Comma", ",");
export const LParen = operator("LParen", "(");
export const RParen = operator("RParen", ")");
export const LSquare = operator("LSquare", "[");
export const RSquare = operator("RSquare", "]");
export const LCurly = operator("LCurly", "{");
export const RCurly = operator("RCurly", "}");
export const RArrow = operator("RArrow", "=>");
export const RelOp = operator("RelOp", /<=|<|>=|>|==|<>/);
export const Equals = operator("Equals", "=", RArrow);

export const Null = keyword("Null"); // literal

export const Not = operator("Not", "!");
export const Dot = operator("Dot", ".");

export const If = keyword("If"); // control keyword
export const Then = keyword("Then"); // control keyword
export const ElseIf = keyword("ElseIf"); // control keyword
export const Else = keyword("Else"); // control keyword

export const Or = keyword("Or"); // logical operator
export const And = keyword("And"); // logical operator

export const AddOp = operator("AddOp", /\+|\.\+|\-|\.\-/);
export const MulOp = operator("MulOp", /%|\*|\/|\.%|\.\*|\.\//);
export const ExpOp = operator("ExpOp", /\^|\.\^/);

export const Semi = operator("Semi", ";");

export const TripleQuoted = add(
  chevrotain.createToken({
    name: "TripleQuoted",
    pattern: /[\"]{3}[\s\S]*?[\"]{3}/,
  })
);

export const StringLiteral = add(
  chevrotain.createToken({
    name: "StringLiteral",
    pattern: /"(:?[^\\"]|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
  })
);

export const NumberLiteral = add(
  chevrotain.createToken({
    name: "NumberLiteral",
    // Note that all these strange letters are the official metric prefixes for SI units, see
    // https://en.wikipedia.org/wiki/International_System_of_Units#Units_and_prefixes
    pattern:
      /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+|Q|R|Y|Z|E|P|T|G|M|k|h|da|d|c|m|μ|u|n|p|f|a|z|y|r|q)?/,
  })
);

export const BooleanLiteral = add(
  chevrotain.createToken({
    name: "BooleanLiteral",
    pattern: /true|false/,
  })
);

add(Identifier);
