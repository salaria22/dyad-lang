import type {
  CstNode,
  ParserMethod,
  Rule,
  IRuleConfig,
  SubruleMethodOpts,
} from "chevrotain";

import { CstParser } from "chevrotain";

export interface Parser {
  RULE<F extends () => void>(
    name: string,
    implementation: F,
    config?: IRuleConfig<CstNode>
  ): ParserMethod<Parameters<F>, CstNode>;
  SUBRULE<ARGS extends unknown[]>(
    ruleToCall: ParserMethod<ARGS, CstNode>,
    options?: SubruleMethodOpts<ARGS>
  ): CstNode;
}
import {
  Identifier,
  End,
  Comma,
  Colon,
  Equals,
  LParen,
  RParen,
  StringLiteral,
  NumberLiteral,
  If,
  Then,
  ElseIf,
  Else,
  Not,
  RelOp,
  AddOp,
  MulOp,
  ExpOp,
  Or,
  And,
  BooleanLiteral,
  Dot,
  LSquare,
  RSquare,
  allTokens,
} from "./dyad_tokens.js";
import { DyadParser } from "./dyad_parser.js";

// This function adds a bunch of rules to a CstParser.  It uses a `this`
// function because these `RULE` methods are protected so we have to "pretend"
// that we are on the "inside" of the `CstParser`. We can then invoke this
// function using `addExpression.bind(this)()`.
export function addExpression(this: ExpressionParser) {
  const expression = this.RULE("expression", () => {
    this.OR([
      { ALT: () => this.SUBRULE(simple_expression) },
      {
        ALT: () => this.SUBRULE(ternary_expression),
      },
    ]);
  });

  const ternary_expression = this.RULE("ternary_expression", () => {
    this.CONSUME(If);
    this.SUBRULE(expression, { LABEL: "cond" });
    this.CONSUME1(Then);
    this.SUBRULE1(expression, { LABEL: "yes" });
    this.MANY(() => {
      this.CONSUME(ElseIf);
      this.SUBRULE2(expression, { LABEL: "ncond" });
      this.CONSUME2(Then);
      this.SUBRULE3(expression, { LABEL: "nyes" });
    });
    this.CONSUME(Else);
    this.SUBRULE4(expression, { LABEL: "no" });
  });

  const simple_expression = this.RULE("simple_expression", () => {
    this.SUBRULE(logical_expression);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE1(logical_expression);
      this.OPTION1(() => {
        this.CONSUME1(Colon);
        this.SUBRULE2(logical_expression);
      });
    });
  });

  const logical_expression = this.RULE("logical_expression", () => {
    this.SUBRULE(logical_term);
    this.MANY(() => {
      this.CONSUME(Or);
      this.SUBRULE1(logical_term);
    });
  });

  const logical_term = this.RULE("logical_term", () => {
    this.SUBRULE(logical_factor);
    this.MANY(() => {
      this.CONSUME(And);
      this.SUBRULE1(logical_factor);
    });
  });

  const logical_factor = this.RULE("logical_factor", () => {
    this.OPTION(() => this.CONSUME(Not));
    this.SUBRULE(relation_expr);
  });

  const relation_expr = this.RULE("relation_expr", () => {
    this.SUBRULE(arithmetic_expression);
    this.OPTION(() => {
      this.CONSUME(RelOp, { LABEL: "rel_op" });
      this.SUBRULE1(arithmetic_expression);
    });
  });

  const arithmetic_expression = this.RULE("arithmetic_expression", () => {
    this.OPTION(() => this.CONSUME(AddOp, { LABEL: "prefix" }));
    this.SUBRULE(term);
    this.MANY(() => {
      this.CONSUME1(AddOp, { LABEL: "add_op" });
      this.SUBRULE1(term);
    });
  });

  const term = this.RULE("term", () => {
    this.SUBRULE(factor);
    this.MANY(() => {
      this.CONSUME(MulOp, { LABEL: "mul_op" });
      this.SUBRULE1(factor);
    });
  });

  const factor = this.RULE("factor", () => {
    this.SUBRULE(primary);
    this.MANY(() => {
      this.CONSUME(ExpOp, { LABEL: "exp_op" });
      this.SUBRULE1(primary);
    });
  });

  // primary:
  //         | "(" output_expression_list ")"
  //         | "[" expression_list { ";" expression_list } "]"
  //         | "{" function_arguments "}"

  const primary = this.RULE("primary", () => {
    this.OR([
      //         UNSIGNED_NUMBER
      {
        ALT: () => this.CONSUME(NumberLiteral, { LABEL: "number" }),
      },
      //         | STRING
      { ALT: () => this.CONSUME2(StringLiteral, { LABEL: "string" }) },
      //         | false
      //         | true
      { ALT: () => this.CONSUME3(BooleanLiteral, { LABEL: "boolean" }) },
      //         | component_reference
      //         | ( name | der | initial ) function_call_args
      {
        ALT: () => {
          this.SUBRULE(component_reference);
          // Optional bit represents invoking a function
          this.OPTION(() => {
            this.CONSUME(LParen);
            this.SUBRULE(argument_list);
            this.CONSUME(RParen);
          });
        },
      },
      {
        ALT: () => this.SUBRULE(parenthetical_expression),
      },
      {
        ALT: () => this.SUBRULE(array_expression),
      },
    ]);
  });

  //   // This rule forces keyword arguments to the end and forces them
  //   // to be behind a `;`.  This is fine if there are positional arguments.
  //   // But it means that a function invocation with _only_ keyword arguments
  //   // requires a `;` prefix at the start which is consistent with Julia, but
  //   // I happen to think is ugly.
  //   const arg_list = this.RULE("arg_list", () => {
  //     this.MANY_SEP({
  //       SEP: Comma,
  //       DEF: () => this.SUBRULE(expression),
  //     });
  //     this.OPTION(() => {
  //       this.CONSUME(Semi);
  //       this.SUBRULE(named_arg_list);
  //     });
  //   });

  //   const named_arg_list = this.RULE("named_arg_list", () => {
  //     this.MANY_SEP1({
  //       SEP: Comma,
  //       DEF: () => {
  //         this.CONSUME(Identifier);
  //         this.CONSUME(Equals);
  //         this.SUBRULE1(expression);
  //       },
  //     });
  //   });

  //   const name = this.RULE("name", () => {
  //     this.OPTION(() => this.CONSUME(Dot));
  //     this.MANY_SEP({
  //       SEP: () => this.CONSUME(Dot),
  //       DEF: () => {
  //         this.CONSUME(Identifier);
  //       },
  //     });
  //   });

  const component_reference = this.RULE("component_reference", () => {
    this.AT_LEAST_ONE_SEP({
      SEP: Dot,
      DEF: () => this.SUBRULE(deref),
    });
  });

  // I'm a bit worried about this aspect of the grammar.  The notion of
  // array dereferencing is intrinsically tied to component references.
  // What this means in practice is that while this is legal:
  //    a.b[3,5]
  // ...this is note...
  //    (a.b)[3,5]
  // Or, more generally, it is not possible to dereference expressions
  // at all, for example:
  //    (a + b)[3]
  // I'm not sure if we need this level of expressiveness since we could
  // always create an alias variable to hold the expression and then
  // dereference the variable (which conforms to the component reference
  // syntax).
  const deref = this.RULE("deref", () => {
    this.CONSUME(Identifier, { LABEL: "name" });
    this.OPTION(() => {
      this.CONSUME(LSquare);
      this.AT_LEAST_ONE_SEP1({
        SEP: Comma,
        DEF: () => {
          this.OR([
            { ALT: () => this.CONSUME(Colon) },
            { ALT: () => this.CONSUME(End) },
            { ALT: () => this.SUBRULE(expression, { LABEL: "dim" }) },
          ]);
        },
      });
      this.CONSUME(RSquare);
    });
  });

  // The problem with this rule is that it does not force keyword
  // arguments to the end.  As such, it forces that to be a semantic
  // error rather than a syntax error.
  const argument_list = this.RULE("argument_list", () => {
    this.MANY_SEP({
      MAX_LOOKAHEAD: 2,
      SEP: Comma,
      DEF: () =>
        this.OR1([
          {
            ALT: () => this.SUBRULE(keyword_pair),
          },
          { ALT: () => this.SUBRULE2(expression) },
        ]),
    });
  });

  const keyword_pair = this.RULE("keyword_pair", () => {
    this.CONSUME(Identifier, { LABEL: "key" });
    this.CONSUME(Equals);
    this.SUBRULE1(expression, { LABEL: "value" });
  });

  const array_expression = this.RULE("array_expression", () => {
    this.CONSUME1(LSquare);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(expression),
    });
    this.CONSUME2(RSquare);
  });

  const parenthetical_expression = this.RULE("parenthetical_expression", () => {
    this.CONSUME1(LParen);
    this.SUBRULE(expression, { LABEL: "expr" });
    this.CONSUME2(RParen);
  });

  return { expression, component_reference };
}

export class ExpressionParser extends CstParser {
  constructor() {
    super(allTokens);
    const rules = addExpression.bind(this as any as DyadParser)();
    this.expression = rules.expression;
    this.component_reference = rules.component_reference;
    this.performSelfAnalysis();
  }

  public expression: ParserMethod<[], CstNode>;
  public component_reference: ParserMethod<[], CstNode>;
}

export function expressionProductions() {
  const parser = new ExpressionParser();
  const productions: Record<string, Rule> = parser.getGAstProductions();
  return productions;
}
