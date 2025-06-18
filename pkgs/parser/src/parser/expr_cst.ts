import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface ExpressionCstNode extends CstNode {
  name: "expression";
  children: ExpressionCstChildren;
}

export type ExpressionCstChildren = {
  simple_expression?: Simple_expressionCstNode[];
  ternary_expression?: Ternary_expressionCstNode[];
};

export interface Ternary_expressionCstNode extends CstNode {
  name: "ternary_expression";
  children: Ternary_expressionCstChildren;
}

export type Ternary_expressionCstChildren = {
  If: IToken[];
  cond: ExpressionCstNode[];
  Then: (IToken)[];
  yes: ExpressionCstNode[];
  ElseIf?: IToken[];
  ncond?: ExpressionCstNode[];
  nyes?: ExpressionCstNode[];
  Else: IToken[];
  no: ExpressionCstNode[];
};

export interface Simple_expressionCstNode extends CstNode {
  name: "simple_expression";
  children: Simple_expressionCstChildren;
}

export type Simple_expressionCstChildren = {
  logical_expression: (Logical_expressionCstNode)[];
  Colon?: (IToken)[];
};

export interface Logical_expressionCstNode extends CstNode {
  name: "logical_expression";
  children: Logical_expressionCstChildren;
}

export type Logical_expressionCstChildren = {
  logical_term: (Logical_termCstNode)[];
  Or?: IToken[];
};

export interface Logical_termCstNode extends CstNode {
  name: "logical_term";
  children: Logical_termCstChildren;
}

export type Logical_termCstChildren = {
  logical_factor: (Logical_factorCstNode)[];
  And?: IToken[];
};

export interface Logical_factorCstNode extends CstNode {
  name: "logical_factor";
  children: Logical_factorCstChildren;
}

export type Logical_factorCstChildren = {
  Not?: IToken[];
  relation_expr: Relation_exprCstNode[];
};

export interface Relation_exprCstNode extends CstNode {
  name: "relation_expr";
  children: Relation_exprCstChildren;
}

export type Relation_exprCstChildren = {
  arithmetic_expression: (Arithmetic_expressionCstNode)[];
  rel_op?: IToken[];
};

export interface Arithmetic_expressionCstNode extends CstNode {
  name: "arithmetic_expression";
  children: Arithmetic_expressionCstChildren;
}

export type Arithmetic_expressionCstChildren = {
  prefix?: IToken[];
  term: (TermCstNode)[];
  add_op?: IToken[];
};

export interface TermCstNode extends CstNode {
  name: "term";
  children: TermCstChildren;
}

export type TermCstChildren = {
  factor: (FactorCstNode)[];
  mul_op?: IToken[];
};

export interface FactorCstNode extends CstNode {
  name: "factor";
  children: FactorCstChildren;
}

export type FactorCstChildren = {
  primary: (PrimaryCstNode)[];
  exp_op?: IToken[];
};

export interface PrimaryCstNode extends CstNode {
  name: "primary";
  children: PrimaryCstChildren;
}

export type PrimaryCstChildren = {
  number?: IToken[];
  string?: IToken[];
  boolean?: IToken[];
  component_reference?: Component_referenceCstNode[];
  LParen?: IToken[];
  argument_list?: Argument_listCstNode[];
  RParen?: IToken[];
  parenthetical_expression?: Parenthetical_expressionCstNode[];
  array_expression?: Array_expressionCstNode[];
};

export interface Component_referenceCstNode extends CstNode {
  name: "component_reference";
  children: Component_referenceCstChildren;
}

export type Component_referenceCstChildren = {
  deref: DerefCstNode[];
  Dot?: IToken[];
};

export interface DerefCstNode extends CstNode {
  name: "deref";
  children: DerefCstChildren;
}

export type DerefCstChildren = {
  name: IToken[];
  LSquare?: IToken[];
  Colon?: IToken[];
  End?: IToken[];
  dim?: ExpressionCstNode[];
  Comma?: IToken[];
  RSquare?: IToken[];
};

export interface Argument_listCstNode extends CstNode {
  name: "argument_list";
  children: Argument_listCstChildren;
}

export type Argument_listCstChildren = {
  keyword_pair?: Keyword_pairCstNode[];
  expression?: ExpressionCstNode[];
  Comma?: IToken[];
};

export interface Keyword_pairCstNode extends CstNode {
  name: "keyword_pair";
  children: Keyword_pairCstChildren;
}

export type Keyword_pairCstChildren = {
  key: IToken[];
  Equals: IToken[];
  value: ExpressionCstNode[];
};

export interface Array_expressionCstNode extends CstNode {
  name: "array_expression";
  children: Array_expressionCstChildren;
}

export type Array_expressionCstChildren = {
  LSquare: IToken[];
  expression?: ExpressionCstNode[];
  Comma?: IToken[];
  RSquare: IToken[];
};

export interface Parenthetical_expressionCstNode extends CstNode {
  name: "parenthetical_expression";
  children: Parenthetical_expressionCstChildren;
}

export type Parenthetical_expressionCstChildren = {
  LParen: IToken[];
  expr: ExpressionCstNode[];
  RParen: IToken[];
};

export interface ExpressionNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  expression(children: ExpressionCstChildren, param?: IN): OUT;
  ternary_expression(children: Ternary_expressionCstChildren, param?: IN): OUT;
  simple_expression(children: Simple_expressionCstChildren, param?: IN): OUT;
  logical_expression(children: Logical_expressionCstChildren, param?: IN): OUT;
  logical_term(children: Logical_termCstChildren, param?: IN): OUT;
  logical_factor(children: Logical_factorCstChildren, param?: IN): OUT;
  relation_expr(children: Relation_exprCstChildren, param?: IN): OUT;
  arithmetic_expression(children: Arithmetic_expressionCstChildren, param?: IN): OUT;
  term(children: TermCstChildren, param?: IN): OUT;
  factor(children: FactorCstChildren, param?: IN): OUT;
  primary(children: PrimaryCstChildren, param?: IN): OUT;
  component_reference(children: Component_referenceCstChildren, param?: IN): OUT;
  deref(children: DerefCstChildren, param?: IN): OUT;
  argument_list(children: Argument_listCstChildren, param?: IN): OUT;
  keyword_pair(children: Keyword_pairCstChildren, param?: IN): OUT;
  array_expression(children: Array_expressionCstChildren, param?: IN): OUT;
  parenthetical_expression(children: Parenthetical_expressionCstChildren, param?: IN): OUT;
}
