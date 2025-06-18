import { CstNode } from "chevrotain";
import {
  Argument_listCstChildren,
  Arithmetic_expressionCstChildren,
  ArrayCstChildren,
  Base_classCstChildren,
  Component_declarationCstChildren,
  Component_metadataCstChildren,
  Component_referenceCstChildren,
  ConnectionCstChildren,
  ConnectorCstChildren,
  ConnvarCstChildren,
  DerefCstChildren,
  Doc_stringCstChildren,
  EnumCstChildren,
  ExpressionCstChildren,
  ExtendsCstChildren,
  FactorCstChildren,
  FileCstChildren,
  JsonCstChildren,
  Keyword_pairCstChildren,
  Logical_expressionCstChildren,
  Logical_factorCstChildren,
  Logical_termCstChildren,
  MetadataCstChildren,
  ComponentCstChildren,
  ObjectCstChildren,
  ObjectItemCstChildren,
  PrimaryCstChildren,
  RelationCstChildren,
  DyadNodeVisitor,
  Simple_expressionCstChildren,
  State_definitionCstChildren,
  TermCstChildren,
  Ternary_expressionCstChildren,
  TransitionCstChildren,
  RelationsCstChildren,
  TypeCstChildren,
  UsingCstChildren,
  ValueCstChildren,
  VariabilityCstChildren,
  Variable_declarationCstChildren,
  Parenthetical_expressionCstChildren,
  ModificationsCstChildren,
  Field_declarationCstChildren,
  StructCstChildren,
  Relation_exprCstChildren,
  AnalysisCstChildren,
  Array_expressionCstChildren,
  FuncCstChildren,
  ContinuityCstChildren,
  Struct_field_declarationCstChildren,
  Enum_caseCstChildren,
  Array_sizeCstChildren,
  Case_clauseCstChildren,
  Switch_statementCstChildren,
  Analysis_pointCstChildren,
  EquationCstChildren,
  AssertionCstChildren,
  Index_specCstChildren,
  SymbolCstChildren,
  Else_clauseCstChildren,
  ForloopCstChildren,
  If_statementCstChildren,
  ModificationCstChildren,
} from "../parser/index.js";
import {
  TypeDefinition,
  QualifiedType,
  Expression,
  unaryExpr,
  booleanLiteral,
  stringLiteral,
  Deref,
  CompRef,
  compRef,
  functionCall,
  StructConnectorDefinition,
  ScalarConnectorDefinition,
  ConnectionVariableDeclaration,
  ConnectorVariableQualifiers,
  ComponentDefinition,
  ComponentDeclaration,
  VariableDeclaration,
  Variability,
  Declaration,
  Equation,
  TernaryExpression,
  ternaryExpression,
  Connection,
  scalarTypeDefinition,
  enumTypeDefinition,
  qualifiedType,
  ParsedFile,
  UnaryOperator,
  DocString,
  MetadataNode,
  parenExpr,
  arrayExpr,
  SourceKey,
  structTypeDefinition,
  StructFieldDeclaration,
  connectionVariable,
  AnalysisDefinition,
  Relation,
  Transition,
  functionTypeDefinition,
  createToken,
  expressionSpan,
  boundingSpan,
  StructTypeDefinition,
  EnumTypeDefinition,
  ContinuitySet,
  scalarConnectorDefinition,
  structConnectorDefinition,
  analysisDefinition,
  componentDefinition,
  variableDeclaration,
  componentDeclaration,
  metadataNode,
  equation,
  parsedFile,
  usingStatement,
  structFieldDeclaration,
  continuitySet,
  connection,
  Token,
  ComponentQualifier,
  AnalysisQualifier,
  CaseClause,
  SwitchStatement,
  caseClause,
  switchStatement,
  AnalysisPoint,
  analysisPoint,
  Assertion,
  assertion,
  undefinedLiteral,
  rangeExpression,
  SymbolInformation,
  FileLevelNode,
  ifStatement,
  elseIfClause,
  forLoopStatement,
  IfStatement,
  ElseIfClause,
  ForLoopStatement,
  Modifications,
  modification,
  spanOrder,
} from "@juliacomputing/dyad-ast";
import { mapOptional, mapArray, mapSingleton } from "./map.js";
import { assertRecord } from "./assert.js";
import {
  as,
  asImage,
  asToken,
  assertTerms,
  getAllTokens,
  getSpan,
  identity,
  parseLiteral,
  reduceBinaryTerms,
  zip,
} from "./helpers.js";
import { evalMetadata } from "./eval_metadata.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { isToken } from "../parser/predicates.js";

export class AstBuilder implements DyadNodeVisitor<any, any> {
  // public errors: SemanticError[] = [];
  file(
    children: FileCstChildren,
    context: { provider: string; file: SourceKey }
  ): ParsedFile {
    const tag = <T extends FileLevelNode>(nodes: T[]): T[] =>
      nodes.map((n) => ({ ...n, source: context.file }));
    const uses = mapArray(children, "using", this.asUsing);
    const structs = mapArray(children, "struct", (node) =>
      this.struct(node.children)
    );
    const enums = mapArray(children, "enum", (node) =>
      this.enum(node.children)
    );
    const types = mapArray(children, "type", (node) =>
      this.type(node.children)
    );
    const connectors = mapArray(children, "connector", (node) =>
      this.connector(node.children)
    );
    const analyses = mapArray(children, "analysis", (node) =>
      this.analysis(node.children)
    );
    const components = mapArray(children, "component", (node) =>
      this.component(node.children)
    );
    const ret = parsedFile(
      context.provider,
      context.file,
      tag(uses),
      tag(
        spanOrder([
          ...types,
          ...structs,
          ...enums,
          ...connectors,
          ...analyses,
          ...components,
        ])
      )
    );
    return ret;
  }

  private asSymbol = as(this.symbol.bind(this));
  symbol(children: SymbolCstChildren, param?: void): SymbolInformation {
    const symbol = mapSingleton(children, "name", asToken);
    const type = mapOptional(children, "type", this.asBaseClass);
    return { symbol, type };
  }

  private asUsing = as(this.using.bind(this));
  using(children: UsingCstChildren, param?: void) {
    const module = mapSingleton(children, "package", asToken);
    const symbols = mapArray(children, "symbol", this.asSymbol);

    return usingStatement(module, symbols, null);
  }

  type(children: TypeCstChildren, src: void): TypeDefinition {
    const typeToken = mapSingleton(children, "Type", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const typename = mapSingleton(children, "typename", asToken);
    const base = mapOptional(children, "base_class", this.asBaseClass);
    const func = mapOptional(children, "func", this.asFunc);
    const metadata = mapOptional(children, "metadata", this.asMetadata);
    /** FIXME: This isn't correct, we need a way to determine the span of entire rules */
    const span = getSpan([typeToken, doc_string]);
    if (base) {
      return scalarTypeDefinition(
        doc_string,
        typename,
        base,
        metadata,
        null,
        span
      );
    }
    if (func) {
      return functionTypeDefinition(
        doc_string,
        typename,
        func.pos,
        func.kw,
        func.ret,
        metadata,
        null,
        span
      );
    }
    throw new Error(
      `Expected scalar type, enum or or struct, but found none of these`
    );
  }

  private asModification = as(this.modification.bind(this));
  modification(children: ModificationCstChildren, param?: void) {
    const span = getSpan(getAllTokens(children));
    const attribute = mapSingleton(children, "attribute", asImage);
    const expr = mapOptional(children, "expr", this.asExpression);
    const final =
      mapOptional(children, "final", asImage) !== null && expr !== null;
    const nested = mapOptional(children, "nested", this.asModifications);
    return { attribute, final, expr, nested, span };
  }

  private asModifications = as(this.modifications.bind(this));
  modifications(
    children: ModificationsCstChildren,
    param?: void
  ): Modifications {
    const mods = mapArray(children, "modification", this.asModification);
    const ret: Modifications = {};
    for (const mod of mods) {
      // TODO: Still not handling nested modifications
      ret[mod.attribute] = modification(
        mod.final,
        mod.expr,
        mod.nested,
        mod.span
      );
    }
    return ret;
  }

  private asBaseClass = as(this.base_class.bind(this));
  base_class(children: Base_classCstChildren, param?: void): QualifiedType {
    const base = mapArray(children, "base", asToken);
    const mods = mapOptional(children, "modifications", this.asModifications);
    const span = getSpan(base);
    return qualifiedType(base, mods, span);
  }

  private asArraySize = as(this.array_size.bind(this));
  array_size(children: Array_sizeCstChildren, param?: any): Array<Expression> {
    return mapArray(children, "subscript", (x) =>
      isToken(x)
        ? undefinedLiteral(getSpan([asToken(x)]))
        : this.asExpression(x)
    );
  }

  private asEnumCase = as(this.enum_case.bind(this));
  enum_case(
    children: Enum_caseCstChildren,
    param?: any
  ): [Token, Array<[string, StructFieldDeclaration]>] {
    const name = mapSingleton(children, "name", asToken);
    const fields = mapArray(
      children,
      "field_declaration",
      this.asFieldDeclaration
    );
    return [name, fields];
  }

  private asEnum = as(this.enum.bind(this));
  enum(children: EnumCstChildren, param?: any): EnumTypeDefinition {
    const typename = mapSingleton(children, "typename", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    // const metadata = mapOptional(children, "metadata", this.asMetadata);

    const cases: Record<string, StructTypeDefinition> = {};
    const elems = mapArray(children, "elements", this.asEnumCase);
    for (const elem of elems) {
      const fields: Record<string, StructFieldDeclaration> = {};
      for (const [name, field] of elem[1]) {
        fields[name] = field;
      }
      cases[elem[0].value] = structTypeDefinition(
        null,
        elem[0],
        fields,
        null,
        null,
        null
      );
    }
    // const tokens = elems.map((e) => e.name[e.name.length - 1]);
    const span = getSpan([doc_string, typename]);

    return enumTypeDefinition(doc_string, typename, cases, null, null, span);
  }

  private asFunc = as(this.func.bind(this));
  func(
    children: FuncCstChildren,
    param?: any
  ): {
    pos: QualifiedType[];
    kw: Record<string, QualifiedType>;
    ret: QualifiedType[];
  } {
    const pos = mapArray(children, "positional", this.asBaseClass);
    const keys = mapArray(children, "key", asImage);
    const vtypes = mapArray(children, "val", this.asBaseClass);
    const ret = mapArray(children, "ret", this.asBaseClass);
    if (keys.length !== vtypes.length) {
      throw new Error(
        `Expected number of keys (${keys.length}) to match the number of types ${vtypes.length} in positional arguments`
      );
    }
    const kw = Object.fromEntries(keys.map((k, i) => [k, vtypes[i]]));
    return { pos, kw, ret };
  }

  private asStruct = as(this.struct.bind(this));
  struct(children: StructCstChildren, param?: any): StructTypeDefinition {
    const duplicates: string[] = [];
    const vars = assertRecord(
      mapArray(children, "fields", this.asStructFieldDeclaration),
      duplicates
    );
    const typename = mapSingleton(children, "typename", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const metadata = mapOptional(children, "metadata", this.asMetadata);
    const end = mapSingleton(children, "End", asToken);

    const span = getSpan([doc_string, typename, end]);

    return structTypeDefinition(
      doc_string,
      typename,
      vars,
      metadata,
      null,
      span
    );
  }

  private asStructFieldDeclaration = as(
    this.struct_field_declaration.bind(this)
  );
  struct_field_declaration(
    children: Struct_field_declarationCstChildren,
    param?: any
  ): [string, StructFieldDeclaration] {
    const decl = mapSingleton(children, "field_declaration", (x) => x);

    return this.field_declaration(decl.children, param);
  }

  private asFieldDeclaration = as(this.field_declaration.bind(this));
  field_declaration(
    children: Field_declarationCstChildren,
    param?: any
  ): [string, StructFieldDeclaration] {
    const name = mapSingleton(children, "name", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const type = mapSingleton(children, "base_class", this.asBaseClass);
    const subs = mapOptional(children, "array_size", this.asArraySize);

    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );

    /** FIXME: This isn't the complete span of this field */
    const span = getSpan([name, doc_string]);

    const init: Nullable<Expression> = mapOptional(
      children,
      "expression",
      this.asExpression
    );

    const decl = structFieldDeclaration(
      name,
      type,
      doc_string,
      metadata,
      init,
      subs ?? [],
      null,
      span
    );

    return [name.value, decl];
  }

  connector(
    children: ConnectorCstChildren,
    src: void
  ): ScalarConnectorDefinition | StructConnectorDefinition {
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const name = mapSingleton(children, "name", asToken);
    const t = this.metadata;
    const f = as(t);
    const metadata = mapOptional(children, "metadata", f);
    if (children.Equals) {
      const type = mapSingleton(children, "base_class", this.asBaseClass);
      let qualifier: Nullable<"input" | "output"> = null;
      if (children.Input) {
        qualifier = "input";
      }
      if (children.Output) {
        qualifier = "output";
      }
      if (qualifier === null) {
        throw Error(`Expected qualifier on connector ${name.value}`);
      }

      /** FIXME: This isn't the correct span */
      const span = getSpan([doc_string, name]);

      return scalarConnectorDefinition(
        name,
        qualifier,
        type,
        doc_string,
        metadata,
        null,
        span,
        []
      );
    } else {
      let end = mapSingleton(children, "End", asToken);
      const duplicates: string[] = [];
      const vars = assertRecord(
        mapArray(children, "connvar", this.asConnvar),
        duplicates
      );

      const span = getSpan([doc_string, name, end]);

      return structConnectorDefinition(
        name,
        vars,
        doc_string,
        metadata,
        null,
        span
      );
    }
  }

  private asConnvar = as(this.connvar.bind(this));
  connvar(
    children: ConnvarCstChildren,
    param?: void
  ): [string, ConnectionVariableDeclaration] {
    const span = getSpan(getAllTokens(children));

    const name = mapSingleton(children, "varname", asToken);
    let qualifier: Nullable<ConnectorVariableQualifiers> = null;
    if (children.Potential) {
      qualifier = "potential";
    } else if (children.Flow) {
      qualifier = "flow";
    } else if (children.Stream) {
      qualifier = "stream";
    } else if (children.Path) {
      qualifier = "path";
    } else if (children.Input) {
      qualifier = "input";
    } else if (children.Output) {
      qualifier = "output";
    } else {
      throw Error(`Expected qualifier on connector ${name.value}`);
    }
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const type = mapSingleton(children, "base_class", this.asBaseClass);
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );
    const subs = mapOptional(children, "array_size", this.asArraySize);

    return [
      name.value,
      connectionVariable(
        doc_string,
        name,
        type,
        subs ?? [],
        null,
        qualifier,
        metadata,
        span
      ),
    ];
  }

  analysis(children: AnalysisCstChildren, src: void): AnalysisDefinition {
    const span = getSpan(getAllTokens(children));
    const name = mapSingleton(children, "name", asToken);
    const test = mapOptional(children, "test", asImage);
    const example = mapOptional(children, "example", asImage);
    const partial = mapOptional(children, "partial", asImage);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const exts = mapArray(children, "extends", this.asExtends);
    const relations = mapArray(children, "relations", this.asRelations ?? []);
    const metadata = mapOptional(children, "metadata", this.asMetadata);

    const duplicates: string[] = [];

    let qualifier: Nullable<AnalysisQualifier> = null;
    if (test !== null) {
      qualifier = "test";
    } else if (example !== null) {
      qualifier = "example";
    } else if (partial !== null) {
      qualifier = "partial";
    }

    /** Process component declarations */
    const components: Array<[string, Declaration]> = mapArray(
      children,
      "component_declaration",
      (x) => this.component_declaration(x.children)
    );

    /** Process variable declarations */
    const variables: Array<[string, Declaration]> = mapArray(
      children,
      "variable_declaration",
      (x) => this.variable_declaration(x.children)
    );

    const declarations = assertRecord(
      [...components, ...variables],
      duplicates
    );

    return analysisDefinition(
      name,
      qualifier,
      exts[0],
      declarations,
      relations.reduce((p, c) => [...p, ...c], []),
      doc_string,
      metadata,
      null,
      span
    );
  }

  component(children: ComponentCstChildren, src: void): ComponentDefinition {
    const span = getSpan(getAllTokens(children));
    const partial = mapOptional(children, "partial", asImage);
    const external = mapOptional(children, "external", asImage);
    const test = mapOptional(children, "test", asImage);
    const example = mapOptional(children, "example", asImage);
    const name = mapSingleton(children, "name", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const exts = mapArray(children, "extends", this.asExtends);
    const relations = mapArray(children, "relations", this.asRelations ?? []);
    const metadata = mapOptional(children, "metadata", this.asMetadata);

    let qualifier: Nullable<ComponentQualifier> = null;
    if (external !== null) {
      qualifier = "external";
    } else if (partial !== null) {
      qualifier = "partial";
    } else if (test !== null) {
      qualifier = "test";
    } else if (example !== null) {
      qualifier = "example";
    }

    //const qualifier = partial ? "partial" : external ? "external" : null;

    const duplicates: string[] = [];

    /** Process component declarations */
    const components: Array<[string, Declaration]> = mapArray(
      children,
      "component_declaration",
      (x) => this.component_declaration(x.children)
    );

    /** Process variable declarations */
    const variables: Array<[string, Declaration]> = mapArray(
      children,
      "variable_declaration",
      (x) => this.variable_declaration(x.children)
    );

    const declarations = assertRecord(
      [...components, ...variables],
      duplicates
    );

    return componentDefinition(
      qualifier,
      name,
      exts,
      declarations,
      relations.reduce((p, c) => [...p, ...c], []),
      doc_string,
      metadata,
      null,
      span
    );
  }

  private asExtends = as(this.extends.bind(this));
  extends(children: ExtendsCstChildren, param?: void): QualifiedType {
    return mapSingleton(children, "base_class", this.asBaseClass);
  }

  state_definition(children: State_definitionCstChildren, param?: any) {
    throw new Error("Method not implemented.");
  }

  private asAssertion = as(this.assertion.bind(this));
  assertion(children: AssertionCstChildren, param?: any): Assertion {
    const span = getSpan(getAllTokens(children));
    const expr = mapSingleton(children, "expression", this.asExpression);
    const message = mapSingleton(children, "StringLiteral", asImage);
    const msg = message.slice(1, message.length - 1);
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );

    return assertion(null, expr, msg, metadata, span);
  }

  private asTransition = as(this.transition.bind(this));
  transition(children: TransitionCstChildren, param?: any): Transition {
    throw new Error("Method not implemented.");
  }

  private asIfStatement = as(this.if_statement.bind(this));
  if_statement(children: If_statementCstChildren, param?: any): IfStatement {
    const cond = mapSingleton(children, "cond", this.asExpression);
    const yes = mapArray(children, "yes", this.asRelation);
    const elif = mapArray(children, "elif", this.asElseClause);
    const no = mapArray(children, "no", this.asRelation);
    const span = getSpan(getAllTokens(children));

    return ifStatement(cond, elif, yes, no, null, null, span);
  }

  private asElseClause = as(this.else_clause.bind(this));
  else_clause(children: Else_clauseCstChildren, param?: any): ElseIfClause {
    const cond = mapSingleton(children, "cond", this.asExpression);
    const rels = mapArray(children, "rels", this.asRelation);
    const span = getSpan(getAllTokens(children));

    return elseIfClause(cond, rels, span);
  }

  private asForLoop = as(this.forloop.bind(this));
  forloop(children: ForloopCstChildren, param?: any): ForLoopStatement {
    const indices = mapArray(children, "index_spec", this.asIndexSpec);
    const relations = mapArray(children, "relations", this.asRelation);
    const span = getSpan(getAllTokens(children));
    return forLoopStatement(indices, relations, null, null, span);
  }

  private asRelation = as(this.relation.bind(this));
  relation(children: RelationCstChildren, params?: any): Relation {
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const name = mapOptional(children, "name", asToken);

    const equation = mapOptional(children, "equation", (x) =>
      this.equation(x.children, name)
    );
    const analysis_point = mapOptional(children, "analysis_point", (x) =>
      this.analysis_point(x.children, name)
    );
    const assertion = mapOptional(children, "assertion", this.asAssertion);
    const transition = mapOptional(children, "transition", this.asTransition);
    const connection = mapOptional(children, "connection", this.asConnection);
    const continuity = mapOptional(children, "continuity", this.asContinuity);
    const switches = mapOptional(
      children,
      "switch_statement",
      this.asSwitchStatement
    );
    const forloop = mapOptional(children, "forloop", this.asForLoop);

    const ret =
      equation ??
      analysis_point ??
      assertion ??
      transition ??
      connection ??
      continuity ??
      switches ??
      forloop;
    if (ret === null) {
      throw new Error(`Expected exactly one relation, got none`);
    }
    // Should we really make this a parse error (not sure how it will get surfaced)
    // Or, should we just ignore it and the name will get dropped after any subsequent
    // unparsing?
    if (transition || connection || connection || switches) {
      if (name !== null) {
        throw new Error(`Relation of type ${ret.kind} cannot have a name`);
      }
    }

    ret.doc_string = doc_string;
    return ret;
  }

  private asRelations = as(this.relations.bind(this));
  relations(children: RelationsCstChildren, param?: void): Relation[] {
    // FIXME: should be relation
    return mapArray(children, "relation", this.asRelation);
  }

  private asContinuity = as(this.continuity.bind(this));
  continuity(children: ContinuityCstChildren, param?: any): ContinuitySet {
    const span = getSpan(getAllTokens(children));
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );
    const variables = mapArray(
      children,
      "component_reference",
      this.asComponentReference
    );

    return continuitySet(null, variables, metadata, span);
  }

  private asConnection = as(this.connection.bind(this));
  connection(children: ConnectionCstChildren, param?: any): Connection {
    const span = getSpan(getAllTokens(children));
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );
    const connectors = mapArray(
      children,
      "component_reference",
      this.asComponentReference
    );

    return connection(null, connectors, metadata, span);
  }

  private asDocString = as(this.doc_string.bind(this));
  doc_string(children: Doc_stringCstChildren, param?: void): DocString {
    const str = mapSingleton(children, "DocLine", asToken);
    const lines = str.value
      .slice(0, -1) // Strip off last trailing \n
      .split("\n")
      .map((line) => line.slice(1).trim());
    const doc = lines.join("\n");
    /** FIXME: This span will include the trailing \n even though the string doesn't */
    return createToken(doc, str.span);
  }

  private asVariability = as(this.variability.bind(this));
  variability(children: VariabilityCstChildren, param?: any): Variability {
    if (children.parameter) {
      if (children.structural) {
        return "structural";
      }
      return "parameter";
    }
    if (children.constant) {
      return "constant";
    }
    if (children.variable) {
      return "variable";
    }
    if (children.path) {
      return "path";
    }
    throw new Error(`Unrecognized variability`);
  }

  variable_declaration(
    children: Variable_declarationCstChildren,
    src: void
  ): [string, VariableDeclaration] {
    const span = getSpan(getAllTokens(children));
    const name = mapSingleton(children, "name", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const type = mapSingleton(children, "base_class", this.asBaseClass);
    const final = mapOptional(children, "Final", asImage) !== null;
    const subs = mapOptional(children, "array_size", this.asArraySize);

    const variability = mapSingleton(
      children,
      "variability",
      this.asVariability
    );
    const init = mapOptional(children, "init", this.asExpression);
    const cond = mapOptional(children, "condition", this.asExpression);
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );

    const decl = variableDeclaration(
      name,
      type,
      subs ?? [],
      cond,
      final,
      init,
      variability,
      doc_string,
      metadata,
      span
    );
    return [name.value, decl];
  }

  private asIndexSpec = as(this.index_spec.bind(this));
  index_spec(
    children: Index_specCstChildren,
    param?: any
  ): { variable: string; range: Expression } {
    const variable = mapSingleton(children, "variable", asImage);
    const range = mapSingleton(children, "range", this.asExpression);
    return { variable, range };
  }

  component_declaration(
    children: Component_declarationCstChildren,
    src: void
  ): [string, ComponentDeclaration] {
    const span = getSpan(getAllTokens(children));
    const name = mapSingleton(children, "name", asToken);
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const instance = mapSingleton(children, "base_class", this.asBaseClass);
    const constraint = mapOptional(children, "constraint", this.asBaseClass);
    const indices = mapArray(children, "index_spec", this.asIndexSpec);
    const cond = mapOptional(children, "condition", this.asExpression);
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );
    const subs = mapOptional(children, "array_size", this.asArraySize);

    const decl = componentDeclaration(
      name,
      instance,
      constraint,
      subs ?? [],
      indices,
      cond,
      doc_string,
      metadata,
      span
    );
    return [name.value, decl];
  }

  private asComponentMetadata = as(this.component_metadata.bind(this));
  component_metadata(
    children: Component_metadataCstChildren,
    param?: void
  ): MetadataNode {
    const left = mapSingleton(children, "LSquare", asToken);
    const right = mapSingleton(children, "RSquare", asToken);
    const span = getSpan([left, right]);
    const value = evalMetadata(children);

    return metadataNode(value, span);
  }

  private asMetadata = as(this.metadata.bind(this));
  metadata(children: MetadataCstChildren, param?: void): MetadataNode {
    const value = evalMetadata(children);
    const obj = children.object[0];
    const start = mapSingleton(children, "Metadata", asToken);
    const end = mapSingleton(obj.children, "RCurly", asToken);
    const span = getSpan([start, end]);
    return metadataNode(value, span);
  }

  private asCaseClause = as(this.case_clause.bind(this));
  case_clause(children: Case_clauseCstChildren, param?: any): CaseClause {
    const span = getSpan(getAllTokens(children));
    const doc_string = mapOptional(children, "doc_string", this.asDocString);
    const id = mapSingleton(children, "id", asToken);
    const rels = mapArray(children, "relation", this.asRelation);
    const metadata = mapOptional(children, "metadata", this.asMetadata);

    return caseClause(id, rels, doc_string, metadata, span);
  }

  private asSwitchStatement = as(this.switch_statement.bind(this));
  switch_statement(
    children: Switch_statementCstChildren,
    param?: any
  ): SwitchStatement {
    const span = getSpan(getAllTokens(children));
    const val = mapSingleton(children, "val", this.asExpression);
    const cases = mapArray(children, "cases", this.asCaseClause);
    const metadata = mapOptional(children, "metadata", this.asMetadata);

    return switchStatement(val, cases, null, null, metadata, span);
  }

  analysis_point(
    children: Analysis_pointCstChildren,
    name: Nullable<Token>
  ): AnalysisPoint {
    const span = getSpan([name, ...getAllTokens(children)]);
    const from = mapSingleton(children, "from", this.asComponentReference);
    const to = mapSingleton(children, "to", this.asComponentReference);
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );

    if (name === null) {
      throw new Error(`Analysis point requires a name`);
    }

    return analysisPoint(name, [from, to], null, metadata, span);
  }

  equation(children: EquationCstChildren, name: Nullable<Token>): Equation {
    const span = getSpan([name, ...getAllTokens(children)]);
    const lhs = mapSingleton(children, "lhs", this.asExpression);
    const rhs = mapSingleton(children, "rhs", this.asExpression);
    const initial = mapOptional(children, "Initial", asImage) !== null;
    const metadata = mapOptional(
      children,
      "component_metadata",
      this.asComponentMetadata
    );
    const when = booleanLiteral(true, null);

    return equation(initial, when, name, lhs, rhs, null, metadata, span);
  }

  json(children: JsonCstChildren, param?: void) {
    throw new Error("Method not implemented.");
  }
  object(children: ObjectCstChildren, param?: void) {
    throw new Error("Method not implemented.");
  }
  objectItem(children: ObjectItemCstChildren, param?: void) {
    throw new Error("Method not implemented.");
  }
  array(children: ArrayCstChildren, param?: void) {
    throw new Error("Method not implemented.");
  }
  value(children: ValueCstChildren, param?: void) {
    throw new Error("Method not implemented.");
  }

  private asExpression = as(this.expression.bind(this));
  expression(children: ExpressionCstChildren, param?: void): Expression {
    if (children.simple_expression) {
      return mapSingleton(
        children,
        "simple_expression",
        this.asSimpleExpression
      );
    }
    if (children.ternary_expression) {
      return mapSingleton(
        children,
        "ternary_expression",
        this.asTernaryExpression
      );
    }
    throw new Error("Method not implemented.");
  }

  private asSimpleExpression = as(this.simple_expression.bind(this));
  simple_expression(
    children: Simple_expressionCstChildren,
    param?: void
  ): Expression {
    if (children.Colon === undefined) {
      return mapSingleton(
        children,
        "logical_expression",
        this.asLogicalExpression
      );
    }
    const exprs = mapArray(
      children,
      "logical_expression",
      this.asLogicalExpression
    );
    if (exprs.length === 2) {
      return rangeExpression(exprs[0], exprs[1], null);
    } else if (exprs.length === 3) {
      return rangeExpression(exprs[0], exprs[2], exprs[1] ?? null);
    } else {
      throw new Error("Method not implemented.");
    }
  }

  private asArrayExpression = as(this.array_expression.bind(this));
  array_expression(children: Array_expressionCstChildren, param?: any) {
    const contents = mapArray(children, "expression", this.asExpression);
    const start = mapSingleton(children, "LSquare", asToken);
    const end = mapSingleton(children, "RSquare", asToken);
    const span = getSpan([start, end]);
    return arrayExpr(contents, span);
  }

  private asParentheticalExpression = as(
    this.parenthetical_expression.bind(this)
  );
  parenthetical_expression(
    children: Parenthetical_expressionCstChildren,
    param?: any
  ): Expression {
    const expr = mapSingleton(children, "expr", this.asExpression);
    const start = mapSingleton(children, "LParen", asToken);
    const end = mapSingleton(children, "RParen", asToken);
    const span = getSpan([start, end]);
    return parenExpr(expr, span);
  }

  private asTernaryExpression = as(this.ternary_expression.bind(this));
  ternary_expression(
    children: Ternary_expressionCstChildren,
    param?: any
  ): TernaryExpression {
    let no = mapSingleton(children, "no", this.asExpression);
    const yes = mapSingleton(children, "yes", this.asExpression);
    const cond = mapSingleton(children, "cond", this.asExpression);

    const ncond = mapArray(children, "ncond", this.asExpression);
    const nyes = mapArray(children, "nyes", this.asExpression);

    if (ncond.length !== nyes.length) {
      throw new Error(
        `Expected number of alternative conditions (${ncond.length}) to match the number of alternative values (${nyes.length})`
      );
    }

    // This is performing a right reduce over the `ncond` array
    for (let i = ncond.length - 1; i >= 0; i--) {
      no = ternaryExpression(ncond[i], nyes[i], no);
    }

    return ternaryExpression(cond, yes, no);
  }

  private asLogicalExpression = as(this.logical_expression.bind(this));
  logical_expression(
    children: Logical_expressionCstChildren,
    param?: void
  ): Expression {
    const terms = mapArray(children, "logical_term", this.asLogicalTerm);
    const ops = mapArray(children, "Or", identity);
    assertTerms(terms, ops);
    return reduceBinaryTerms(terms, ops);
  }

  private asLogicalTerm = as(this.logical_term.bind(this));
  logical_term(children: Logical_termCstChildren, param?: void): Expression {
    const terms = mapArray(children, "logical_factor", this.asLogicalFactor);
    const ops = mapArray(children, "And", identity);
    assertTerms(terms, ops);
    return reduceBinaryTerms(terms, ops);
  }

  private asLogicalFactor = as(this.logical_factor.bind(this));
  logical_factor(
    children: Logical_factorCstChildren,
    param?: void
  ): Expression {
    const expr = mapSingleton(children, "relation_expr", this.asRelationExpr);
    const not = mapOptional(children, "Not", asToken);
    if (not) {
      const span = boundingSpan([not.span, expressionSpan(expr)]);
      return unaryExpr("not", false, expr, span);
    }
    return expr;
  }

  private asRelationExpr = as(this.relation_expr.bind(this));
  relation_expr(children: Relation_exprCstChildren, param?: void): Expression {
    const terms = mapArray(
      children,
      "arithmetic_expression",
      this.asArithmeticExpression
    );
    const ops = mapArray(children, "rel_op", identity);
    assertTerms(terms, ops);
    return reduceBinaryTerms(terms, ops);
  }

  private asArithmeticExpression = as(this.arithmetic_expression.bind(this));
  arithmetic_expression(
    children: Arithmetic_expressionCstChildren,
    param?: void
  ): Expression {
    const prefix = mapOptional(children, "prefix", asToken);
    const terms = mapArray(children, "term", this.asTerm);
    // If prefix is present, first term needs to be transformed into a unary
    // expression
    if (prefix !== null) {
      const span = boundingSpan([prefix.span, expressionSpan(terms[0])]);
      const u = unaryExpr(prefix.value as UnaryOperator, false, terms[0], span);
      terms[0] = u;
    }
    const ops = mapArray(children, "add_op", identity);
    assertTerms(terms, ops);
    return reduceBinaryTerms(terms, ops);
  }

  private asTerm = as(this.term.bind(this));
  term(children: TermCstChildren, param?: void): Expression {
    const terms = mapArray(children, "factor", this.asFactor);
    const ops = mapArray(children, "mul_op", identity);
    assertTerms(terms, ops);
    return reduceBinaryTerms(terms, ops);
  }

  private asFactor = as(this.factor.bind(this));
  factor(children: FactorCstChildren, param?: void): Expression {
    const terms = mapArray(children, "primary", this.asPrimary);
    const ops = mapArray(children, "exp_op", identity);
    assertTerms(terms, ops);
    // TODO: Check right associativity is correct
    return reduceBinaryTerms(terms, ops, true);
  }

  private asPrimary = as(this.primary.bind(this));
  primary(children: PrimaryCstChildren, param?: void): Expression {
    if (children.number) {
      return mapSingleton(children, "number", (token) =>
        parseLiteral(asToken(token))
      );
    }
    if (children.boolean) {
      return mapSingleton(children, "boolean", (token) =>
        booleanLiteral(token.image === "true", asToken(token).span)
      );
    }
    if (children.string) {
      const str = mapSingleton(children, "string", asToken);
      return stringLiteral(
        str.value.slice(1, str.value.length - 1),
        false,
        str.span
      );
    }
    if (children.component_reference) {
      const cref = mapSingleton(
        children,
        "component_reference",
        this.asComponentReference
      );
      if (children.argument_list) {
        const args = mapSingleton(
          children,
          "argument_list",
          this.asArgumentList
        );
        const cspan = expressionSpan(cref);
        const close = mapArray(children, "RParen", asToken);
        const span = boundingSpan([cspan, ...close.map((x) => x.span)]);
        return functionCall(cref, args[0], args[1], span);
      }
      return cref;
    }
    if (children.array_expression) {
      return mapSingleton(children, "array_expression", this.asArrayExpression);
    }
    if (children.parenthetical_expression) {
      return mapSingleton(
        children,
        "parenthetical_expression",
        this.asParentheticalExpression
      );
    }
    throw new Error("Method 'primary' not implemented.");
  }

  private asArgumentList = as(this.argument_list.bind(this));
  argument_list(
    children: Argument_listCstChildren,
    param?: void
  ): [Expression[], Record<string, Expression>] {
    const positional = mapArray(children, "expression", this.asExpression);
    const keyword = mapArray(children, "keyword_pair", this.asKeywordPair);
    return [positional, Object.fromEntries(keyword)];
  }

  private asKeywordPair = as(this.keyword_pair.bind(this));
  keyword_pair(
    children: Keyword_pairCstChildren,
    param?: any
  ): [string, Expression] {
    const key = mapSingleton(children, "key", asImage);
    const expr = mapSingleton(children, "value", this.asExpression);
    return [key, expr];
  }

  private asDeref = as(this.deref.bind(this));
  deref(children: DerefCstChildren, param?: any): Deref {
    const ident = mapSingleton(children, "name", asToken);
    const closes = mapArray(children, "RSquare", asToken);
    const subs = mapArray(children, "dim", this.asExpression);
    const span = boundingSpan([ident, ...closes].map((x) => x.span));
    return {
      name: ident.value,
      indices: subs,
      span: span,
    };
  }

  private asComponentReference = as(this.component_reference.bind(this));
  component_reference(
    children: Component_referenceCstChildren,
    param?: void
  ): CompRef {
    return compRef(mapArray(children, "deref", this.asDeref));
  }

  visit(cstNode: CstNode | CstNode[], param?: void) {
    if (Array.isArray(cstNode)) {
      throw new Error("Arrays of CST nodes unsupported in JsonEval.visit");
    }
    const name = cstNode.name;
    const children = cstNode.children;
    return (this as any)[name](children);
  }
  validateVisitor(): void {
    throw new Error("Method not implemented.");
  }
}
