import { Nullable } from "@juliacomputing/dyad-common";
import { Children, possibleMetadata } from "./children.js";
import { DeclarationBase } from "./decl_base.js";
import { ASTNode } from "./node.js";
import { Expression } from "../expr/expr.js";
import { QualifiedType } from "./qualifier.js";
import { DocString } from "./docs.js";
import { MetadataNode } from "./metadata.js";
import { TextualSpan } from "./span.js";
import { Token } from "./token.js";

/**
 * The information associated with a given variable declaration inside a
 * connector definition.
 *
 * @category AST Nodes
 */
export interface StructFieldDeclaration extends DeclarationBase {
  kind: "field";
  /** Initialization expression */
  init: Nullable<Expression>;
}

export function structFieldDeclaration(
  name: Token,
  type: QualifiedType,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  init: Nullable<Expression>,
  dims: Array<Expression>,
  cond: Nullable<Expression>,
  span: TextualSpan
): StructFieldDeclaration {
  return {
    kind: "field",
    name,
    type,
    dims,
    cond,
    doc_string,
    metadata,
    init,
    span,
  };
}

/**
 * List the children of a `StructFieldDeclaration` node
 *
 * @category Navigation
 * @param decl
 * @returns
 */
export function structFieldDeclarationChildren(
  decl: StructFieldDeclaration
): Children {
  return possibleMetadata(decl);
}

/**
 * Check if a given `ASTNode` is an instance of a `StructFieldDeclaration`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isStructFieldDeclaration(
  node: ASTNode | null
): node is StructFieldDeclaration {
  return node !== null && node.kind === "field";
}
