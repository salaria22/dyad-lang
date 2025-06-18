import type { CstNode, IParserConfig, ParserMethod, IToken, TokenType, IRecognitionException, IParserErrorMessageProvider } from "chevrotain";
import {
  Connector,
  Identifier,
  End,
  allTokens,
  Potential,
  Flow,
  Stream,
  Path,
  Continuity,
  DoubleColon,
  Using,
  Type,
  Comma,
  Colon,
  Semi,
  Equals,
  LParen,
  RParen,
  Partial,
  Final,
  External,
  Analysis,
  Component,
  Metadata,
  Extends,
  DocLine,
  Connect,
  LSquare,
  RSquare,
  Parameter,
  Constant,
  Variable,
  Pipe,
  Enum,
  Assert,
  Transition,
  RArrow,
  Initial,
  State,
  Struct,
  Relations,
  Input,
  Output,
  Func,
  Dot,
  Test,
  Example,
  Switch,
  Case,
  Default,
  AnalysisPoint,
  StringLiteral,
  For,
  In,
  If,
  Structural,
  Else,
  ElseIf,
} from "./dyad_tokens.js";
import { addExpression } from "./expr_parser.js";
import { addJson } from "./metadata_parser.js";

import { CstParser } from "chevrotain";

// Define specific types for the options arguments based on Chevrotain's expected structure
interface IMismatchTokenOptions {
    expected: TokenType;
    actual: IToken; // For MismatchToken, actual is a single token
    previous: IToken;
    ruleName: string;
    recoverySuggestion?: string;
}

interface INoViableAltOptions {
    previous: IToken;
    actual: IToken[]; // For NoViableAlt, actual is an array of tokens
    customUserDescription?: string;
    ruleName: string;
    expectedPathsPerAlt?: TokenType[][][]; // Added from linter hint
}

interface IEarlyExitOptions {
    previous: IToken;
    actual: IToken[]; // For EarlyExit, actual is an array of tokens
    customUserDescription?: string;
    ruleName: string;
    expectedIterationPaths?: TokenType[][]; // Added from linter hint
}

interface INotAllInputParsedOptions {
    firstRedundant: IToken; // Corrected name from linter hint
    ruleName: string;
}

const customErrorMessageProvider: IParserErrorMessageProvider = {
    buildMismatchTokenMessage: (options: IMismatchTokenOptions): string => {
      const { expected, actual, ruleName, previous } = options;

      // If the specific pattern above wasn't met, proceed with other error messages.
      let msg = `In rule '${ruleName}', I expected to see a '${expected.name}' but found '${actual.image}' (which is a '${actual.tokenType.name}') instead.`;

      // --- General Errors ---
      if (expected.name === "Identifier") {
        msg = `I was expecting a name (an Identifier), but found '${actual.image}' in the '${ruleName}' rule.`;
      }
      if (expected.name === "Semi") {
        msg = `It looks like a semicolon ';' is missing at the end of this statement in the '${ruleName}' rule. I found '${actual.image}' instead.`;
      }
      if (expected.name === "End") {
        msg = `The '${ruleName}' block needs to be closed with an 'end' keyword, but I found '${actual.image}'.`;
      }
      if (expected.name === "Equals") {
        msg = `I was expecting an equals sign '=' here for an assignment or definition in '${ruleName}', but found '${actual.image}'.`;
      }
      if (expected.name === "DoubleColon") {
        msg = `I was expecting '::' for a type annotation or symbol scope in '${ruleName}', but found '${actual.image}'.`;
      }
      if (expected.name === "LParen") {
        msg = `I was expecting an opening parenthesis '(' for a list, arguments, or grouped expression in '${ruleName}', but found '${actual.image}'.`;
      }
      if (expected.name === "RParen") {
        msg = `I was expecting a closing parenthesis ')' to end a list, arguments, or grouped expression in '${ruleName}', but found '${actual.image}'.`;
      }
      if (expected.name === "Comma") {
        msg = `I was expecting a comma ',' to separate items in a list or arguments in '${ruleName}', but found '${actual.image}'.`;
      }

      // --- Specific Rule Errors for MismatchToken ---
      else if (ruleName === "using") {
        if (expected.name === "Identifier" && previous.tokenType.name === "Using") {
            msg = `After 'using', I expected a package name (e.g., 'MyPackage'), but found '${actual.image}'.`;
        } else if (expected.name === "Colon" && actual.tokenType.name !== "Colon"){
            msg = `In a 'using' statement, if you're importing specific symbols, use a colon ':' after the package name (e.g., 'using MyPackage: Symbol1'). I found '${actual.image}'.`;
        }
      } else if (ruleName === "struct" || ruleName === "component" || ruleName === "analysis" || ruleName === "state_definition") {
        if (expected.name === "Identifier" && (previous.tokenType.name === "Struct" || previous.tokenType.name === "Component" || previous.tokenType.name === "Analysis" || previous.tokenType.name === "State")) {
            msg = `The '${previous.tokenType.name.toLowerCase()}' declaration needs a name, but I found '${actual.image}'. Example: '${previous.tokenType.name.toLowerCase()} MyName ... end'.`;
        }
      } else if (ruleName === "type") {
        if (expected.name === "Identifier" && previous.tokenType.name === "Type") {
            msg = `A 'type' definition needs a name, like 'type MyCustomType = ...', but I found '${actual.image}'.`;
        }
      } else if (ruleName === "enum") {
         if (expected.name === "Identifier" && previous.tokenType.name === "Enum") {
            msg = `An 'enum' definition needs a name, like 'enum MyEnum = ...', but I found '${actual.image}'.`;
        } else if (expected.name === "Pipe" && actual.tokenType.name !== "Pipe") {
            msg = `Enum cases should be separated by a pipe symbol '|'. Example: 'enum MyEnum = | Case1 | Case2'. I found '${actual.image}'.`;
        }
      } else if (ruleName === "func") {
        if (expected.name === "DoubleColon" && previous.tokenType.name === "RParen") {
            msg = `A function signature needs a '::' before its return type. Example: 'func()::ReturnType'. I found '${actual.image}'.`;
        }
      } else if (ruleName === "equation") {
        if (expected.name === "Equals" && actual.tokenType.name !== "Equals") {
            msg = `An equation requires an equals sign '='. Example: 'variableA = variableB + 10'. I found '${actual.image}'.`;
        }
      } else if (ruleName === "assertion") {
        if (expected.name === "StringLiteral") {
            msg = `An 'assert' statement needs a message string after the comma. Example: 'assert(condition, "Error message")'. I found '${actual.image}'.`;
        }
      } else if (ruleName === "transition") {
        if (expected.name === "RArrow") {
            msg = `A 'transition' needs an arrow '=>' between states. Example: 'transition(StateA => StateB, condition)'. I found '${actual.image}'.`;
        }
      }
      return msg;
    },
    buildNoViableAltMessage: (options: INoViableAltOptions): string => {
      const { ruleName, actual, previous } = options;
      const actualTokenImage = actual.length > 0 ? actual[0].image : "(unknown token)";
      const actualTokenType = actual.length > 0 ? actual[0].tokenType.name : "(unknown type)";

      // --- Check for dangling equals before certain keywords in expression rules ---
      const expressionRuleNames = ["expression", "simple_expression", "logical_expression", "arithmetic_expression", "primary"];
      const blockStartingOrEndingKeywords = [
        "Relations", "Metadata", "End", "Using", "Type", "Struct", "Enum",
        "Connector", "Analysis", "Component"
      ];

      if (expressionRuleNames.includes(ruleName) && previous && previous.tokenType.name === "Equals" && blockStartingOrEndingKeywords.includes(actualTokenType)) {
        return `It looks like an assignment or equation was left incomplete. An expression was expected after the \'=\' sign, but '${actualTokenImage}' was found instead. Please complete the statement before '${actualTokenImage}'.`;
      }

      let msg = `I encountered an unexpected token '${actualTokenImage}' while trying to parse the '${ruleName}' rule and couldn't understand this part of your code.`;

      if (ruleName === "file") {
        msg = `I encountered an unexpected token '${actualTokenImage}'. I was expecting the start of a new declaration like 'component', 'type', 'struct', 'enum', 'connector', 'analysis', or 'using'.`;
      } else if (ruleName === "relation") {
        msg = `I encountered '${actualTokenImage}' inside a 'relations' block, but it doesn't look like a valid relation (e.g., an equation 'x = y', 'connect(...)', 'if...', etc.).`;
      } else if (ruleName === "variability") {
        msg = `I found '${actualTokenImage}' where I expected a variable type keyword like 'parameter', 'constant', 'variable', or 'path'.`;
      } else if (ruleName === "connvar") {
        msg = `I found '${actualTokenImage}' in a connector definition where I expected a connector variable type like 'potential', 'flow', 'stream', 'path', 'input', or 'output'.`;
      } else if (ruleName === "expression" || ruleName === "simple_expression" || ruleName === "logical_expression" || ruleName === "arithmetic_expression" || ruleName === "primary") {
        msg = `I found an unexpected token '${actualTokenImage}' while parsing an expression. This could be a misplaced operator, a missing value, or an unrecognized symbol.`;
      }
      return msg;
    },
    buildEarlyExitMessage(options: IEarlyExitOptions): string {
        const actualTokenImage = options.actual.length > 0 ? options.actual[0].image : "(unknown token)";
        return `In rule '${options.ruleName}', the parser exited earlier than expected near '${actualTokenImage}'. This might happen if a required element is missing or if there's an unexpected token.`;
    },
    buildNotAllInputParsedMessage(options: INotAllInputParsedOptions): string {
        return `I finished parsing what I understood, but there seems to be extra content starting with '${options.firstRedundant.image}' that I don\'t know how to process.`;
    }
};

const parserConfig: IParserConfig = {
  // maxLookahead: 8,
  errorMessageProvider: customErrorMessageProvider
};

export class DyadParser extends CstParser {
  constructor() {
    super(allTokens, parserConfig);
    const rules = addExpression.bind(this)();
    this.expression = rules.expression;
    this.component_reference = rules.component_reference;
    this.performSelfAnalysis();
  }

  // In TypeScript the parsing rules are explicitly defined as class instance properties
  // This allows for using access control (public/private/protected) and more importantly "informs" the TypeScript compiler
  // about the API of our Parser, so referencing an invalid rule name (this.SUBRULE(this.oopsType);)
  // is now a TypeScript compilation error.
  public file = this.RULE("file", () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.using) },
        { ALT: () => this.SUBRULE(this.type) },
        { ALT: () => this.SUBRULE(this.struct) },
        { ALT: () => this.SUBRULE(this.enum) },
        { ALT: () => this.SUBRULE(this.connector) },
        { ALT: () => this.SUBRULE(this.analysis) },
        { ALT: () => this.SUBRULE(this.component) },
      ]);
    });
  });

  public symbol = this.RULE("symbol", () => {
    this.CONSUME(Identifier, { LABEL: "name" });
    this.OPTION2(() => {
      this.CONSUME(DoubleColon);
      this.SUBRULE(this.base_class, { LABEL: "type" });
    });
  });

  /**
   * `using <package>[: <symbols>*]
   */
  public using = this.RULE("using", () => {
    this.CONSUME(Using);
    this.OR([
      { ALT: () => this.CONSUME1(Identifier, { LABEL: "package" }) },
      { ALT: () => this.CONSUME1(Dot, { LABEL: "package" }) },
    ]);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.MANY_SEP({
        SEP: Comma,
        DEF: () => {
          this.SUBRULE(this.symbol, { LABEL: "symbol" });
        },
      });
    });
    this.OPTION1(() => this.CONSUME(Semi));
  });

  public struct = this.RULE("struct", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.CONSUME(Struct);
    this.CONSUME1(Identifier, { LABEL: "typename" });
    this.MANY(() =>
      this.SUBRULE(this.struct_field_declaration, { LABEL: "fields" })
    );
    this.OPTION5(() => this.SUBRULE(this.metadata));
    this.CONSUME(End);
    this.OPTION1(() => this.CONSUME(Semi));
  });

  public type = this.RULE("type", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.CONSUME(Type);
    this.CONSUME1(Identifier, { LABEL: "typename" });
    this.CONSUME2(Equals);
    this.OR([
      { ALT: () => this.SUBRULE(this.func) },
      { ALT: () => this.SUBRULE(this.base_class) },
    ]);
    this.OPTION5(() => this.SUBRULE(this.metadata));
    this.OPTION1(() => this.CONSUME(Semi));
  });

  public enum = this.RULE("enum", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.CONSUME(Enum);
    this.CONSUME1(Identifier, { LABEL: "typename" });
    this.CONSUME2(Equals);
    this.OPTION2(() => this.CONSUME2(Pipe));
    this.AT_LEAST_ONE_SEP({
      SEP: Pipe,
      DEF: () => this.SUBRULE(this.enum_case, { LABEL: "elements" }),
    }),
      this.OPTION1(() => this.CONSUME(Semi));
  });

  public func = this.RULE("func", () => {
    this.CONSUME(Func);
    this.CONSUME(LParen);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.CONSUME1(DoubleColon);
        this.SUBRULE1(this.base_class, { LABEL: "positional" });
      },
    });
    this.OPTION(() => {
      this.CONSUME(Semi);
      this.MANY_SEP2({
        SEP: Comma,
        DEF: () => {
          this.CONSUME2(Identifier, { LABEL: "key" });
          this.CONSUME2(DoubleColon);
          this.SUBRULE2(this.base_class, { LABEL: "val" });
        },
      });
    });
    this.CONSUME(RParen);
    this.CONSUME3(DoubleColon);
    this.OR([
      {
        ALT: () => {
          this.CONSUME1(LParen);
          this.AT_LEAST_ONE_SEP1({
            SEP: Comma,
            DEF: () => {
              this.CONSUME4(DoubleColon);
              this.SUBRULE3(this.base_class, { LABEL: "ret" });
            },
          });
          this.CONSUME1(RParen);
        },
      },
      {
        ALT: () => this.SUBRULE4(this.base_class, { LABEL: "ret" }),
      },
    ]);
  });

  public enum_case = this.RULE("enum_case", () => {
    this.OPTION1(() => this.SUBRULE(this.doc_string));
    this.CONSUME1(Identifier, { LABEL: "name" });
    this.OPTION2(() => {
      this.CONSUME2(LParen);
      this.MANY_SEP({
        SEP: Comma,
        DEF: () => {
          this.SUBRULE(this.field_declaration);
        },
      });
      this.CONSUME3(RParen);
    });
  });

  public field_declaration = this.RULE("field_declaration", () => {
    this.OPTION1(() => this.SUBRULE(this.doc_string));
    this.CONSUME(Identifier, { LABEL: "name" });
    this.CONSUME(DoubleColon);
    this.SUBRULE2(this.base_class);
    this.OPTION3(() => this.SUBRULE(this.array_size));
    this.OPTION4(() => {
      this.CONSUME(Equals);
      this.SUBRULE2(this.expression);
    });
    this.OPTION5(() => {
      this.SUBRULE3(this.component_metadata);
    });
  });

  public struct_field_declaration = this.RULE(
    "struct_field_declaration",
    () => {
      this.SUBRULE(this.field_declaration);
      this.OPTION2(() => this.CONSUME(Semi));
    }
  );

  public modification = this.RULE("modification", () => {
    this.OPTION(() => this.CONSUME(Final, { LABEL: "final" }));
    this.CONSUME(Identifier, { LABEL: "attribute" });
    this.OR([
      {
        ALT: () => {
          this.CONSUME1(Equals);
          // This should really be a component reference
          this.SUBRULE1(this.expression, { LABEL: "expr" });
        },
      },
      {
        ALT: () => {
          this.SUBRULE(this.modifications, { LABEL: "nested" });
          this.OPTION2(() => {
            this.CONSUME2(Equals);
            // This should really be a component reference
            this.SUBRULE2(this.expression, { LABEL: "expr" });
          });
        },
      },
    ]);
  });

  public modifications = this.RULE("modifications", () => {
    this.CONSUME(LParen);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.modification, { LABEL: "modification" }),
    });
    this.CONSUME(RParen);
  });

  public base_class = this.RULE("base_class", () => {
    this.AT_LEAST_ONE_SEP({
      SEP: Dot,
      DEF: () => {
        this.CONSUME(Identifier, { LABEL: "base" });
      },
    });
    this.OPTION(() => this.SUBRULE(this.modifications));
  });

  public array_size = this.RULE("array_size", () => {
    this.CONSUME(LSquare);
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => {
        this.OR([
          { ALT: () => this.SUBRULE(this.expression, { LABEL: "subscript" }) },
          { ALT: () => this.CONSUME(Colon, { LABEL: "subscript" }) },
        ]);
      },
    });
    this.CONSUME(RSquare);
  });

  public connector = this.RULE("connector", () => {
    this.OPTION1(() => this.SUBRULE1(this.doc_string));
    this.CONSUME1(Connector);
    this.CONSUME2(Identifier, { LABEL: "name" });
    this.OR1([
      {
        ALT: () => {
          this.AT_LEAST_ONE(() => this.SUBRULE2(this.connvar));
          this.OPTION2(() => this.SUBRULE(this.metadata));
          this.CONSUME5(End);
        },
      },
      {
        ALT: () => {
          this.CONSUME(Equals);
          this.OR2([
            { ALT: () => this.CONSUME3(Input) },
            { ALT: () => this.CONSUME4(Output) },
          ]);
          this.SUBRULE3(this.base_class);
          this.OPTION3(() => this.SUBRULE4(this.metadata));
        },
      },
    ]);
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public connvar = this.RULE("connvar", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.OR([
      { ALT: () => this.CONSUME(Potential) },
      { ALT: () => this.CONSUME1(Flow) },
      { ALT: () => this.CONSUME2(Stream) },
      { ALT: () => this.CONSUME3(Path) },
      { ALT: () => this.CONSUME3(Input) },
      { ALT: () => this.CONSUME3(Output) },
    ]);
    this.CONSUME(Identifier, { LABEL: "varname" });
    this.CONSUME(DoubleColon);
    this.SUBRULE(this.base_class);
    this.OPTION2(() => this.SUBRULE(this.array_size));
    this.OPTION3(() => this.SUBRULE(this.component_metadata));
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public analysis = this.RULE("analysis", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.OPTION2(() => {
      this.OR1([
        { ALT: () => this.CONSUME(Test, { LABEL: "test" }) },
        { ALT: () => this.CONSUME(Example, { LABEL: "example" }) },
        { ALT: () => this.CONSUME(Partial, { LABEL: "partial" }) },
      ]);
    });
    this.CONSUME(Analysis);
    this.CONSUME(Identifier, { LABEL: "name" });
    this.SUBRULE(this.extends);
    this.MANY1(() => {
      this.OR2([
        { ALT: () => this.SUBRULE(this.component_declaration) },
        { ALT: () => this.SUBRULE(this.variable_declaration) },
      ]);
    });
    this.OPTION6(() => this.SUBRULE(this.relations));
    this.OPTION5(() => this.SUBRULE(this.metadata));
    this.CONSUME(End);
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public component = this.RULE("component", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.OPTION2(() => {
      this.OR1([
        { ALT: () => this.CONSUME(Partial, { LABEL: "partial" }) },
        { ALT: () => this.CONSUME(External, { LABEL: "external" }) },
        { ALT: () => this.CONSUME(Test, { LABEL: "test" }) },
        { ALT: () => this.CONSUME(Example, { LABEL: "example" }) },
      ]);
    });
    this.CONSUME(Component);
    this.CONSUME(Identifier, { LABEL: "name" });
    this.MANY(() => this.SUBRULE(this.extends));
    this.MANY1(() => {
      this.OR2([
        { ALT: () => this.SUBRULE(this.component_declaration) },
        { ALT: () => this.SUBRULE(this.variable_declaration) },
        { ALT: () => this.SUBRULE(this.state_definition) },
      ]);
    });
    this.OPTION6(() => this.SUBRULE(this.relations));
    this.OPTION5(() => this.SUBRULE(this.metadata));
    this.CONSUME(End);
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public extends = this.RULE("extends", () => {
    this.CONSUME(Extends);
    this.SUBRULE(this.base_class);
    this.OPTION1(() => this.CONSUME(Semi));
  });

  public relation = this.RULE("relation", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.OPTION1(() => {
      this.CONSUME(Identifier, { LABEL: "name" });
      this.CONSUME(Colon);
    });
    this.OR([
      { ALT: () => this.SUBRULE(this.continuity) },
      { ALT: () => this.SUBRULE(this.connection) },
      { ALT: () => this.SUBRULE(this.assertion) },
      { ALT: () => this.SUBRULE(this.transition) },
      // Grammar ambiguity vs. equations that start with if expressions
      // { ALT: () => this.SUBRULE(this.if_statement) },
      { ALT: () => this.SUBRULE(this.forloop) },
      { ALT: () => this.SUBRULE(this.switch_statement) },
      { ALT: () => this.SUBRULE(this.equation) },
      { ALT: () => this.SUBRULE(this.analysis_point) },
    ]);
  });

  public relations = this.RULE("relations", () => {
    this.CONSUME(Relations);
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.relation);
    });
  });

  public equation = this.RULE("equation", () => {
    this.OPTION1(() => this.CONSUME(Initial));
    this.SUBRULE(this.expression, { LABEL: "lhs" });
    this.CONSUME(Equals);
    this.SUBRULE1(this.expression, { LABEL: "rhs" });
    this.OPTION3(() => this.SUBRULE(this.component_metadata));
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public if_statement = this.RULE("if_statement", () => {
    this.CONSUME(If);
    this.SUBRULE(this.expression, { LABEL: "cond" });
    this.AT_LEAST_ONE1(() => this.SUBRULE1(this.relation, { LABEL: "yes" }));
    this.MANY(() => this.SUBRULE(this.else_clause, { LABEL: "elif" }));
    this.CONSUME1(Else);
    this.AT_LEAST_ONE2(() => this.SUBRULE2(this.relation, { LABEL: "no" }));
    this.OPTION3(() => this.SUBRULE(this.metadata));
    this.CONSUME(End);
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public else_clause = this.RULE("else_clause", () => {
    this.CONSUME(ElseIf);
    this.SUBRULE(this.expression, { LABEL: "cond" });
    this.AT_LEAST_ONE(() => this.SUBRULE(this.relation, { LABEL: "rels" }));
  });

  public forloop = this.RULE("forloop", () => {
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.index_spec),
    });
    this.AT_LEAST_ONE(() =>
      this.SUBRULE(this.relation, { LABEL: "relations" })
    );
    this.CONSUME(End);
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public switch_statement = this.RULE("switch_statement", () => {
    this.CONSUME(Switch);
    this.SUBRULE(this.expression, { LABEL: "val" });
    this.AT_LEAST_ONE(() => this.SUBRULE(this.case_clause, { LABEL: "cases" }));
    this.OPTION3(() => this.SUBRULE(this.metadata));
    this.CONSUME(End);
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public assertion = this.RULE("assertion", () => {
    this.CONSUME(Assert);
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(Comma);
    this.CONSUME(StringLiteral);
    this.CONSUME(RParen);
    this.OPTION3(() => this.SUBRULE(this.component_metadata));
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public transition = this.RULE("transition", () => {
    this.CONSUME(Transition);
    this.CONSUME(LParen);
    this.CONSUME1(Identifier);
    this.CONSUME(RArrow);
    this.CONSUME2(Identifier);
    this.CONSUME(Comma);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
    this.OPTION2(() => this.SUBRULE(this.component_metadata));
    this.OPTION3(() => this.CONSUME(Semi));
  });

  public continuity = this.RULE("continuity", () => {
    this.CONSUME(Continuity);
    this.CONSUME(LParen);
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.component_reference),
    });
    this.CONSUME(RParen);
    this.OPTION2(() => this.SUBRULE(this.component_metadata));
    this.OPTION3(() => this.CONSUME(Semi));
  });

  public analysis_point = this.RULE("analysis_point", () => {
    this.CONSUME(AnalysisPoint);
    this.CONSUME(LParen);
    this.SUBRULE1(this.component_reference, { LABEL: "from" });
    this.CONSUME(Comma);
    this.SUBRULE2(this.component_reference, { LABEL: "to" });
    this.CONSUME(RParen);
    this.OPTION3(() => this.SUBRULE(this.component_metadata));
    this.OPTION4(() => this.CONSUME(Semi));
  });

  public connection = this.RULE("connection", () => {
    this.CONSUME(Connect);
    this.CONSUME(LParen);
    this.AT_LEAST_ONE_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.component_reference),
    });
    this.CONSUME(RParen);
    this.OPTION2(() => this.SUBRULE(this.component_metadata));
    this.OPTION3(() => this.CONSUME(Semi));
  });

  public doc_string = this.RULE("doc_string", () => {
    this.CONSUME(DocLine);
  });

  public variability = this.RULE("variability", () => {
    this.OR([
      {
        ALT: () => {
          this.OPTION(() => this.CONSUME(Structural, { LABEL: "structural" }));
          this.CONSUME(Parameter, { LABEL: "parameter" });
        },
      },
      { ALT: () => this.CONSUME(Path, { LABEL: "path" }) },
      { ALT: () => this.CONSUME1(Constant, { LABEL: "constant" }) },
      { ALT: () => this.CONSUME(Variable, { LABEL: "variable" }) },
    ]);
  });

  public variable_declaration = this.RULE("variable_declaration", () => {
    this.OPTION1(() => this.SUBRULE(this.doc_string));
    this.OPTION2(() => this.CONSUME(Final));
    this.SUBRULE(this.variability);
    this.CONSUME(Identifier, { LABEL: "name" });
    this.CONSUME(DoubleColon);
    this.SUBRULE2(this.base_class);
    this.OPTION3(() => this.SUBRULE(this.array_size));
    this.OPTION4(() => {
      this.CONSUME(Equals);
      this.SUBRULE2(this.expression, { LABEL: "init" });
    });
    this.OPTION5(() => {
      this.CONSUME(If);
      this.SUBRULE(this.expression, { LABEL: "condition" });
    });
    this.OPTION6(() => {
      this.SUBRULE3(this.component_metadata);
    });
    this.OPTION7(() => this.CONSUME(Semi));
  });

  public state_definition = this.RULE("state_definition", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.OPTION1(() => this.CONSUME(Initial));
    this.CONSUME(State);
    this.CONSUME(Identifier, { LABEL: "name" });
    this.MANY2(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.component_declaration) },
        { ALT: () => this.SUBRULE(this.variable_declaration) },
        { ALT: () => this.SUBRULE(this.state_definition) },
      ]);
    });
    this.OPTION4(() => this.SUBRULE(this.relations));
    this.CONSUME(End);
    this.OPTION5(() => this.CONSUME(Semi));
  });

  public index_spec = this.RULE("index_spec", () => {
    this.CONSUME(For);
    this.CONSUME(Identifier, { LABEL: "variable" });
    this.CONSUME(In);
    this.SUBRULE(this.expression, { LABEL: "range" });
  });

  public component_declaration = this.RULE("component_declaration", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.CONSUME(Identifier, { LABEL: "name" });
    this.OPTION1(() => {
      this.CONSUME(DoubleColon);
      this.SUBRULE1(this.base_class, { LABEL: "constraint" });
      this.OPTION3(() => this.SUBRULE(this.array_size));
    });
    this.CONSUME(Equals);
    this.OR([
      {
        ALT: () => {
          this.CONSUME(LSquare);
          this.SUBRULE2(this.base_class);
          this.AT_LEAST_ONE_SEP({
            SEP: Comma,
            DEF: () => this.SUBRULE(this.index_spec),
          });
          this.CONSUME(RSquare);
        },
      },
      { ALT: () => this.SUBRULE3(this.base_class) },
    ]);
    this.OPTION4(() => {
      this.CONSUME(If);
      this.SUBRULE(this.expression, { LABEL: "condition" });
    });
    this.OPTION5(() => {
      this.SUBRULE(this.component_metadata);
    });
    this.OPTION6(() => this.CONSUME(Semi));
  });

  public component_metadata = this.RULE("component_metadata", () => {
    this.CONSUME(LSquare);
    this.SUBRULE(this.object);
    this.CONSUME(RSquare);
  });

  public metadata = this.RULE("metadata", () => {
    this.CONSUME(Metadata);
    this.SUBRULE(this.object);
    this.OPTION(() => this.CONSUME(Semi));
  });

  public case_clause = this.RULE("case_clause", () => {
    this.OPTION(() => this.SUBRULE(this.doc_string));
    this.OR([
      { ALT: () => this.CONSUME3(Default, { LABEL: "id" }) },
      {
        ALT: () => {
          this.CONSUME1(Case);
          this.CONSUME2(Identifier, { LABEL: "id" });
        },
      },
    ]);
    this.MANY(() => this.SUBRULE(this.relation));
    this.OPTION3(() => this.SUBRULE(this.metadata));
    this.CONSUME7(End);
    this.OPTION4(() => this.CONSUME8(Semi));
  });

  // Bring in the whole expression grammar (although we only really care about
  // the expression rule).
  public expression: ParserMethod<[], CstNode>;
  public component_reference: ParserMethod<[], CstNode>;

  // Brings in the grammar for a JSON value
  public object: ParserMethod<[], CstNode> = addJson.bind(this)();
}
