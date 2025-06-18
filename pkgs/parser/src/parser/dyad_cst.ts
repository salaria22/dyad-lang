import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface FileCstNode extends CstNode {
  name: "file";
  children: FileCstChildren;
}

export type FileCstChildren = {
  using?: UsingCstNode[];
  type?: TypeCstNode[];
  struct?: StructCstNode[];
  enum?: EnumCstNode[];
  connector?: ConnectorCstNode[];
  analysis?: AnalysisCstNode[];
  component?: ComponentCstNode[];
};

export interface SymbolCstNode extends CstNode {
  name: "symbol";
  children: SymbolCstChildren;
}

export type SymbolCstChildren = {
  name: IToken[];
  DoubleColon?: IToken[];
  type?: Base_classCstNode[];
};

export interface UsingCstNode extends CstNode {
  name: "using";
  children: UsingCstChildren;
}

export type UsingCstChildren = {
  Using: IToken[];
  package?: (IToken)[];
  Colon?: IToken[];
  symbol?: SymbolCstNode[];
  Comma?: IToken[];
  Semi?: IToken[];
};

export interface StructCstNode extends CstNode {
  name: "struct";
  children: StructCstChildren;
}

export type StructCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Struct: IToken[];
  typename: IToken[];
  fields?: Struct_field_declarationCstNode[];
  metadata?: MetadataCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface TypeCstNode extends CstNode {
  name: "type";
  children: TypeCstChildren;
}

export type TypeCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Type: IToken[];
  typename: IToken[];
  Equals: IToken[];
  func?: FuncCstNode[];
  base_class?: Base_classCstNode[];
  metadata?: MetadataCstNode[];
  Semi?: IToken[];
};

export interface EnumCstNode extends CstNode {
  name: "enum";
  children: EnumCstChildren;
}

export type EnumCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Enum: IToken[];
  typename: IToken[];
  Equals: IToken[];
  Pipe?: (IToken)[];
  elements: Enum_caseCstNode[];
  Semi?: IToken[];
};

export interface FuncCstNode extends CstNode {
  name: "func";
  children: FuncCstChildren;
}

export type FuncCstChildren = {
  Func: IToken[];
  LParen: (IToken)[];
  DoubleColon: (IToken)[];
  positional?: Base_classCstNode[];
  Comma?: (IToken)[];
  Semi?: IToken[];
  key?: IToken[];
  val?: Base_classCstNode[];
  RParen: (IToken)[];
  ret?: (Base_classCstNode)[];
};

export interface Enum_caseCstNode extends CstNode {
  name: "enum_case";
  children: Enum_caseCstChildren;
}

export type Enum_caseCstChildren = {
  doc_string?: Doc_stringCstNode[];
  name: IToken[];
  LParen?: IToken[];
  field_declaration?: Field_declarationCstNode[];
  Comma?: IToken[];
  RParen?: IToken[];
};

export interface Field_declarationCstNode extends CstNode {
  name: "field_declaration";
  children: Field_declarationCstChildren;
}

export type Field_declarationCstChildren = {
  doc_string?: Doc_stringCstNode[];
  name: IToken[];
  DoubleColon: IToken[];
  base_class: Base_classCstNode[];
  array_size?: Array_sizeCstNode[];
  Equals?: IToken[];
  expression?: ExpressionCstNode[];
  component_metadata?: Component_metadataCstNode[];
};

export interface Struct_field_declarationCstNode extends CstNode {
  name: "struct_field_declaration";
  children: Struct_field_declarationCstChildren;
}

export type Struct_field_declarationCstChildren = {
  field_declaration: Field_declarationCstNode[];
  Semi?: IToken[];
};

export interface ModificationCstNode extends CstNode {
  name: "modification";
  children: ModificationCstChildren;
}

export type ModificationCstChildren = {
  final?: IToken[];
  attribute: IToken[];
  Equals?: (IToken)[];
  expr?: (ExpressionCstNode)[];
  nested?: ModificationsCstNode[];
};

export interface ModificationsCstNode extends CstNode {
  name: "modifications";
  children: ModificationsCstChildren;
}

export type ModificationsCstChildren = {
  LParen: IToken[];
  modification?: ModificationCstNode[];
  Comma?: IToken[];
  RParen: IToken[];
};

export interface Base_classCstNode extends CstNode {
  name: "base_class";
  children: Base_classCstChildren;
}

export type Base_classCstChildren = {
  base: IToken[];
  Dot?: IToken[];
  modifications?: ModificationsCstNode[];
};

export interface Array_sizeCstNode extends CstNode {
  name: "array_size";
  children: Array_sizeCstChildren;
}

export type Array_sizeCstChildren = {
  LSquare: IToken[];
  subscript?: (ExpressionCstNode | IToken)[];
  Comma?: IToken[];
  RSquare: IToken[];
};

export interface ConnectorCstNode extends CstNode {
  name: "connector";
  children: ConnectorCstChildren;
}

export type ConnectorCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Connector: IToken[];
  name: IToken[];
  connvar?: ConnvarCstNode[];
  metadata?: (MetadataCstNode)[];
  End?: IToken[];
  Equals?: IToken[];
  Input?: IToken[];
  Output?: IToken[];
  base_class?: Base_classCstNode[];
  Semi?: IToken[];
};

export interface ConnvarCstNode extends CstNode {
  name: "connvar";
  children: ConnvarCstChildren;
}

export type ConnvarCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Potential?: IToken[];
  Flow?: IToken[];
  Stream?: IToken[];
  Path?: IToken[];
  Input?: IToken[];
  Output?: IToken[];
  varname: IToken[];
  DoubleColon: IToken[];
  base_class: Base_classCstNode[];
  array_size?: Array_sizeCstNode[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface AnalysisCstNode extends CstNode {
  name: "analysis";
  children: AnalysisCstChildren;
}

export type AnalysisCstChildren = {
  doc_string?: Doc_stringCstNode[];
  test?: IToken[];
  example?: IToken[];
  partial?: IToken[];
  Analysis: IToken[];
  name: IToken[];
  extends: ExtendsCstNode[];
  component_declaration?: Component_declarationCstNode[];
  variable_declaration?: Variable_declarationCstNode[];
  relations?: RelationsCstNode[];
  metadata?: MetadataCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface ComponentCstNode extends CstNode {
  name: "component";
  children: ComponentCstChildren;
}

export type ComponentCstChildren = {
  doc_string?: Doc_stringCstNode[];
  partial?: IToken[];
  external?: IToken[];
  test?: IToken[];
  example?: IToken[];
  Component: IToken[];
  name: IToken[];
  extends?: ExtendsCstNode[];
  component_declaration?: Component_declarationCstNode[];
  variable_declaration?: Variable_declarationCstNode[];
  state_definition?: State_definitionCstNode[];
  relations?: RelationsCstNode[];
  metadata?: MetadataCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface ExtendsCstNode extends CstNode {
  name: "extends";
  children: ExtendsCstChildren;
}

export type ExtendsCstChildren = {
  Extends: IToken[];
  base_class: Base_classCstNode[];
  Semi?: IToken[];
};

export interface RelationCstNode extends CstNode {
  name: "relation";
  children: RelationCstChildren;
}

export type RelationCstChildren = {
  doc_string?: Doc_stringCstNode[];
  name?: IToken[];
  Colon?: IToken[];
  continuity?: ContinuityCstNode[];
  connection?: ConnectionCstNode[];
  assertion?: AssertionCstNode[];
  transition?: TransitionCstNode[];
  forloop?: ForloopCstNode[];
  switch_statement?: Switch_statementCstNode[];
  equation?: EquationCstNode[];
  analysis_point?: Analysis_pointCstNode[];
};

export interface RelationsCstNode extends CstNode {
  name: "relations";
  children: RelationsCstChildren;
}

export type RelationsCstChildren = {
  Relations: IToken[];
  relation: RelationCstNode[];
};

export interface EquationCstNode extends CstNode {
  name: "equation";
  children: EquationCstChildren;
}

export type EquationCstChildren = {
  Initial?: IToken[];
  lhs: ExpressionCstNode[];
  Equals: IToken[];
  rhs: ExpressionCstNode[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface If_statementCstNode extends CstNode {
  name: "if_statement";
  children: If_statementCstChildren;
}

export type If_statementCstChildren = {
  If: IToken[];
  cond: ExpressionCstNode[];
  yes: RelationCstNode[];
  elif?: Else_clauseCstNode[];
  Else: IToken[];
  no: RelationCstNode[];
  metadata?: MetadataCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface Else_clauseCstNode extends CstNode {
  name: "else_clause";
  children: Else_clauseCstChildren;
}

export type Else_clauseCstChildren = {
  ElseIf: IToken[];
  cond: ExpressionCstNode[];
  rels: RelationCstNode[];
};

export interface ForloopCstNode extends CstNode {
  name: "forloop";
  children: ForloopCstChildren;
}

export type ForloopCstChildren = {
  index_spec: Index_specCstNode[];
  Comma?: IToken[];
  relations: RelationCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface Switch_statementCstNode extends CstNode {
  name: "switch_statement";
  children: Switch_statementCstChildren;
}

export type Switch_statementCstChildren = {
  Switch: IToken[];
  val: ExpressionCstNode[];
  cases: Case_clauseCstNode[];
  metadata?: MetadataCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface AssertionCstNode extends CstNode {
  name: "assertion";
  children: AssertionCstChildren;
}

export type AssertionCstChildren = {
  Assert: IToken[];
  LParen: IToken[];
  expression: ExpressionCstNode[];
  Comma: IToken[];
  StringLiteral: IToken[];
  RParen: IToken[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface TransitionCstNode extends CstNode {
  name: "transition";
  children: TransitionCstChildren;
}

export type TransitionCstChildren = {
  Transition: IToken[];
  LParen: IToken[];
  Identifier: (IToken)[];
  RArrow: IToken[];
  Comma: IToken[];
  expression: ExpressionCstNode[];
  RParen: IToken[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface ContinuityCstNode extends CstNode {
  name: "continuity";
  children: ContinuityCstChildren;
}

export type ContinuityCstChildren = {
  Continuity: IToken[];
  LParen: IToken[];
  component_reference: Component_referenceCstNode[];
  Comma?: IToken[];
  RParen: IToken[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface Analysis_pointCstNode extends CstNode {
  name: "analysis_point";
  children: Analysis_pointCstChildren;
}

export type Analysis_pointCstChildren = {
  Analysis_point: IToken[];
  LParen: IToken[];
  from: Component_referenceCstNode[];
  Comma: IToken[];
  to: Component_referenceCstNode[];
  RParen: IToken[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface ConnectionCstNode extends CstNode {
  name: "connection";
  children: ConnectionCstChildren;
}

export type ConnectionCstChildren = {
  Connect: IToken[];
  LParen: IToken[];
  component_reference: Component_referenceCstNode[];
  Comma?: IToken[];
  RParen: IToken[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface Doc_stringCstNode extends CstNode {
  name: "doc_string";
  children: Doc_stringCstChildren;
}

export type Doc_stringCstChildren = {
  DocLine: IToken[];
};

export interface VariabilityCstNode extends CstNode {
  name: "variability";
  children: VariabilityCstChildren;
}

export type VariabilityCstChildren = {
  structural?: IToken[];
  parameter?: IToken[];
  path?: IToken[];
  constant?: IToken[];
  variable?: IToken[];
};

export interface Variable_declarationCstNode extends CstNode {
  name: "variable_declaration";
  children: Variable_declarationCstChildren;
}

export type Variable_declarationCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Final?: IToken[];
  variability: VariabilityCstNode[];
  name: IToken[];
  DoubleColon: IToken[];
  base_class: Base_classCstNode[];
  array_size?: Array_sizeCstNode[];
  Equals?: IToken[];
  init?: ExpressionCstNode[];
  If?: IToken[];
  condition?: ExpressionCstNode[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface State_definitionCstNode extends CstNode {
  name: "state_definition";
  children: State_definitionCstChildren;
}

export type State_definitionCstChildren = {
  doc_string?: Doc_stringCstNode[];
  Initial?: IToken[];
  State: IToken[];
  name: IToken[];
  component_declaration?: Component_declarationCstNode[];
  variable_declaration?: Variable_declarationCstNode[];
  state_definition?: State_definitionCstNode[];
  relations?: RelationsCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface Index_specCstNode extends CstNode {
  name: "index_spec";
  children: Index_specCstChildren;
}

export type Index_specCstChildren = {
  For: IToken[];
  variable: IToken[];
  In: IToken[];
  range: ExpressionCstNode[];
};

export interface Component_declarationCstNode extends CstNode {
  name: "component_declaration";
  children: Component_declarationCstChildren;
}

export type Component_declarationCstChildren = {
  doc_string?: Doc_stringCstNode[];
  name: IToken[];
  DoubleColon?: IToken[];
  constraint?: Base_classCstNode[];
  array_size?: Array_sizeCstNode[];
  Equals: IToken[];
  LSquare?: IToken[];
  base_class?: (Base_classCstNode)[];
  index_spec?: Index_specCstNode[];
  Comma?: IToken[];
  RSquare?: IToken[];
  If?: IToken[];
  condition?: ExpressionCstNode[];
  component_metadata?: Component_metadataCstNode[];
  Semi?: IToken[];
};

export interface Component_metadataCstNode extends CstNode {
  name: "component_metadata";
  children: Component_metadataCstChildren;
}

export type Component_metadataCstChildren = {
  LSquare: IToken[];
  object: ObjectCstNode[];
  RSquare: IToken[];
};

export interface MetadataCstNode extends CstNode {
  name: "metadata";
  children: MetadataCstChildren;
}

export type MetadataCstChildren = {
  Metadata: IToken[];
  object: ObjectCstNode[];
  Semi?: IToken[];
};

export interface Case_clauseCstNode extends CstNode {
  name: "case_clause";
  children: Case_clauseCstChildren;
}

export type Case_clauseCstChildren = {
  doc_string?: Doc_stringCstNode[];
  id?: (IToken)[];
  Case?: IToken[];
  relation?: RelationCstNode[];
  metadata?: MetadataCstNode[];
  End: IToken[];
  Semi?: IToken[];
};

export interface JsonCstNode extends CstNode {
  name: "json";
  children: JsonCstChildren;
}

export type JsonCstChildren = {
  object?: ObjectCstNode[];
  array?: ArrayCstNode[];
};

export interface ObjectCstNode extends CstNode {
  name: "object";
  children: ObjectCstChildren;
}

export type ObjectCstChildren = {
  LCurly: IToken[];
  objectItem?: ObjectItemCstNode[];
  Comma?: IToken[];
  RCurly: IToken[];
};

export interface ObjectItemCstNode extends CstNode {
  name: "objectItem";
  children: ObjectItemCstChildren;
}

export type ObjectItemCstChildren = {
  StringLiteral: IToken[];
  Colon: IToken[];
  value: ValueCstNode[];
};

export interface ArrayCstNode extends CstNode {
  name: "array";
  children: ArrayCstChildren;
}

export type ArrayCstChildren = {
  LSquare: IToken[];
  value?: ValueCstNode[];
  Comma?: IToken[];
  RSquare: IToken[];
};

export interface ValueCstNode extends CstNode {
  name: "value";
  children: ValueCstChildren;
}

export type ValueCstChildren = {
  StringLiteral?: IToken[];
  prefix?: IToken[];
  NumberLiteral?: IToken[];
  object?: ObjectCstNode[];
  array?: ArrayCstNode[];
  BooleanLiteral?: IToken[];
  Null?: IToken[];
};

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

export interface DyadNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  file(children: FileCstChildren, param?: IN): OUT;
  symbol(children: SymbolCstChildren, param?: IN): OUT;
  using(children: UsingCstChildren, param?: IN): OUT;
  struct(children: StructCstChildren, param?: IN): OUT;
  type(children: TypeCstChildren, param?: IN): OUT;
  enum(children: EnumCstChildren, param?: IN): OUT;
  func(children: FuncCstChildren, param?: IN): OUT;
  enum_case(children: Enum_caseCstChildren, param?: IN): OUT;
  field_declaration(children: Field_declarationCstChildren, param?: IN): OUT;
  struct_field_declaration(children: Struct_field_declarationCstChildren, param?: IN): OUT;
  modification(children: ModificationCstChildren, param?: IN): OUT;
  modifications(children: ModificationsCstChildren, param?: IN): OUT;
  base_class(children: Base_classCstChildren, param?: IN): OUT;
  array_size(children: Array_sizeCstChildren, param?: IN): OUT;
  connector(children: ConnectorCstChildren, param?: IN): OUT;
  connvar(children: ConnvarCstChildren, param?: IN): OUT;
  analysis(children: AnalysisCstChildren, param?: IN): OUT;
  component(children: ComponentCstChildren, param?: IN): OUT;
  extends(children: ExtendsCstChildren, param?: IN): OUT;
  relation(children: RelationCstChildren, param?: IN): OUT;
  relations(children: RelationsCstChildren, param?: IN): OUT;
  equation(children: EquationCstChildren, param?: IN): OUT;
  if_statement(children: If_statementCstChildren, param?: IN): OUT;
  else_clause(children: Else_clauseCstChildren, param?: IN): OUT;
  forloop(children: ForloopCstChildren, param?: IN): OUT;
  switch_statement(children: Switch_statementCstChildren, param?: IN): OUT;
  assertion(children: AssertionCstChildren, param?: IN): OUT;
  transition(children: TransitionCstChildren, param?: IN): OUT;
  continuity(children: ContinuityCstChildren, param?: IN): OUT;
  analysis_point(children: Analysis_pointCstChildren, param?: IN): OUT;
  connection(children: ConnectionCstChildren, param?: IN): OUT;
  doc_string(children: Doc_stringCstChildren, param?: IN): OUT;
  variability(children: VariabilityCstChildren, param?: IN): OUT;
  variable_declaration(children: Variable_declarationCstChildren, param?: IN): OUT;
  state_definition(children: State_definitionCstChildren, param?: IN): OUT;
  index_spec(children: Index_specCstChildren, param?: IN): OUT;
  component_declaration(children: Component_declarationCstChildren, param?: IN): OUT;
  component_metadata(children: Component_metadataCstChildren, param?: IN): OUT;
  metadata(children: MetadataCstChildren, param?: IN): OUT;
  case_clause(children: Case_clauseCstChildren, param?: IN): OUT;
  json(children: JsonCstChildren, param?: IN): OUT;
  object(children: ObjectCstChildren, param?: IN): OUT;
  objectItem(children: ObjectItemCstChildren, param?: IN): OUT;
  array(children: ArrayCstChildren, param?: IN): OUT;
  value(children: ValueCstChildren, param?: IN): OUT;
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
