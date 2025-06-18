import { Nullable } from "@juliacomputing/dyad-common";
import { Children, possibleMetadata } from "./children.js";
import { DocString } from "./docs.js";
import { Expression } from "../expr/expr.js";
import { DeclarationBase } from "./decl_base.js";
import { MetadataNode } from "./metadata.js";
import { ASTNode } from "./node.js";
import { QualifiedType } from "./qualifier.js";
import { Token } from "./token.js";
import { TextualSpan } from "./span.js";

/**
 * This type enumerates all the different qualifiers associated with variables
 * in a connector.  Each of these qualifiers brings with it a different set of
 * semantics for generating equations involving the variables this qualifier is
 * associated with.
 *
 * @category AST Nodes
 */
export type ConnectorVariableQualifiers =
  | "flow" /** A flow variable represents the flow of a conserved quantity.  When flow variables are added to a connection set, they are all summed to zero. */
  | "potential" /** A potential variable represents the driving force behind the dynamics in a system.  When potential variables are added to a connection set, they are all set equal to each other. */
  | "path" /** A path variable should be defined in exactly one place across the spanning tree that this connector belongs to. */
  | "stream" /** A stream variable represents an intensive quantity associated with the `flow` variable in the connector.  NB - if a stream variable is present, there can only be one flow variable. */
  | "input" /** An input variable represents information that should be provided externally */
  | "output"; /** An output variable represents information that should be provided by the component itself */

/**
 * The information associated with a given variable declaration inside a
 * connector definition.
 *
 * @category AST Nodes
 */
export interface ConnectionVariableDeclaration extends DeclarationBase {
  kind: "cvar";
  qualifier: ConnectorVariableQualifiers;
}

/**
 * A constructor for a `ConnectionVariableDeclaration` node
 *
 * @category AST Nodes
 * @param doc_string
 * @param name
 * @param type
 * @param dims
 * @param qualifier
 * @param metadata
 * @param span
 * @returns
 */
export function connectionVariable(
  doc_string: Nullable<DocString>,
  name: Token,
  type: QualifiedType,
  dims: Array<Expression>,
  cond: Nullable<Expression>,
  qualifier: ConnectorVariableQualifiers,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): ConnectionVariableDeclaration {
  return {
    kind: "cvar",
    doc_string,
    name,
    type,
    dims,
    cond,
    qualifier,
    metadata,
    span,
  };
}

/**
 * Children of a `ConnectionVariableDeclaration` node
 *
 * @category Navigation
 *
 * @param decl A `ConnectionVariableDeclaration` node
 * @returns
 */
export function connectionVariableDeclarationChildren(
  decl: ConnectionVariableDeclaration
): Children {
  return possibleMetadata(decl);
}

/**
 * Determine if a given node is a `ConnectionVariableDeclaration` node
 * @category Type Predicates
 *
 * @param node An AST Node
 * @returns
 */
export function isConnectionVariable(
  node: ASTNode | null
): node is ConnectionVariableDeclaration {
  return node !== null && node.kind === "cvar";
}
