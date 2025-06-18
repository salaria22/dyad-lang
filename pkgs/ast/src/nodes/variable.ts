import { DocString } from "./docs.js";
import { Expression } from "../expr/expr.js";
import { MetadataNode } from "./metadata.js";
import { ASTNode } from "./node.js";
import { Children, possibleMetadata } from "./children.js";
import { DeclarationBase } from "./decl_base.js";
import { QualifiedType } from "./qualifier.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";
import { TextualSpan } from "./span.js";

/**
 * This qualifier indicates how a given variable varies with time.  A "variable"
 * varies continuously with respect to time, a "parameter" can be set only
 * before the simulation starts and a "constant" can never be changed after the
 * model is compiled.
 *
 * @category AST Nodes
 */
export type Variability =
  | "path"
  | "variable"
  | "parameter"
  | "structural"
  | "constant";

/** Information associated with a variable declaration
 *
 * @category AST Nodes
 */
export interface VariableDeclaration extends DeclarationBase {
  kind: "var";
  /** Indicates if the `init` expression can every be overridden */
  final: boolean;
  // TODO: How to handle declaration local equations (ala Modelica)?
  /** The expression for the initial value of this variable. */
  init: Nullable<Expression>;
  /** The time variability of this variable */
  variability: Variability;
}

/**
 * List the children of a `VariableDeclaration` node
 *
 * @category Navigation
 * @param decl
 * @returns
 */
export function variableDeclarationChildren(
  decl: VariableDeclaration
): Children {
  const ret = possibleMetadata(decl);
  return ret;
}

/** This function can be used to construct a `VariableDeclaration`
 *
 * @category AST Nodes
 */
export function variableDeclaration(
  name: Token,
  type: QualifiedType,
  dims: Array<Expression>,
  cond: Nullable<Expression>,
  final: boolean,
  init: Nullable<Expression>,
  variability: Variability,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): VariableDeclaration {
  return {
    kind: "var",
    name,
    type,
    dims,
    cond,
    final,
    init,
    variability,
    doc_string,
    metadata,
    span,
  };
}

/**
 * A predicate to determine if a given `ASTNode` is an instance of `VariableDeclaration`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isVariableDeclaration(
  node: ASTNode | null
): node is VariableDeclaration {
  return node !== null && node.kind === "var";
}
