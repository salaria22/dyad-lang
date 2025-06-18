import { MetadataNode } from "./metadata.js";
import { DocString } from "./docs.js";
import { TextualSpan } from "./span.js";
import { ASTNode } from "./node.js";
import { ConnectionVariableDeclaration } from "./convar.js";
import { Children, childObject, possibleMetadata } from "./children.js";
import { QualifiedType } from "./qualifier.js";
import { Expression } from "../expr/expr.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";
import { SourceKey } from "./keys.js";

/**
 * This is an AST Node representing the definition of a connector with multiple
 * declared elements.
 *
 * @category AST Nodes
 *
 */
export interface StructConnectorDefinition {
  kind: "strcon";
  /** Name of the connector being defined. */
  name: Token;
  /** The variables contained in the connector (and their associated declarations) */
  elements: Record<string, ConnectionVariableDeclaration>;
  /** The (optional) doc string associated with the connector definition */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with the connector definition */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * This function is used to construct a connector definition.
 *
 * @category AST Nodes
 *
 * @param name Name of the connector being defined.
 * @param elements The variables contained in the connector (and their associated declarations)
 * @param doc_string The (optional) doc string associated with the connector definition
 * @param metadata Any (optional) metadata associated with the connector definition
 * @param span The span of the struct definition
 * @returns
 */
export function structConnectorDefinition(
  name: Token,
  elements: Record<string, ConnectionVariableDeclaration>,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): StructConnectorDefinition {
  return {
    kind: "strcon",
    name,
    elements,
    doc_string,
    metadata,
    source,
    span,
  };
}

/**
 * List the children of a `StructConnectorDefinition` node
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function structConnectorDefinitionChildren(
  def: StructConnectorDefinition
): Children {
  const ret: Children = possibleMetadata(def);
  const elements = childObject("elements", def);

  return { ...ret, ...elements };
}

/**
 * This is an AST Node representing the definition of a connector represented by
 * a scalar quantity. Unlike a struct connector, the only qualifiers allowed
 * for a scalar connector definition are directional.
 *
 * @category AST Nodes
 *
 */
export interface ScalarConnectorDefinition {
  kind: "sclcon";
  /** Name of the connector being defined. */
  name: Token;
  /** Qualifier for scalar type (must be exactly one) */
  qualifier: "input" | "output";
  /** Defines the type (should allow *at least* scalar types) */
  type: QualifiedType;
  /**
   * Dimensions (if any) associated with this.  Dimensions need to be static in this case
   * since there is no context from which to extract size parameters.
   */
  dims: Array<Expression>;
  /** The (optional) doc string associated with the connector definition */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with the connector definition */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

export function scalarConnectorDefinition(
  name: Token,
  qualifier: ScalarConnectorDefinition["qualifier"],
  type: QualifiedType,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>,
  dims: Array<Expression>
): ScalarConnectorDefinition {
  return {
    kind: "sclcon",
    name,
    qualifier,
    type,
    doc_string,
    metadata,
    span,
    source,
    dims,
  };
}

/**
 * List the children of a `ScalarConnectorDefinition` node
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function scalarConnectorDefinitionChildren(
  def: ScalarConnectorDefinition
): Children {
  const ret: Children = possibleMetadata(def);

  return { ...ret, type: def.type };
}

/**
 * Union of connector definition types
 *
 * @category AST Nodes
 */
export type ConnectorDefinition =
  | StructConnectorDefinition
  | ScalarConnectorDefinition;

/**
 * A predicate to determine if a given node is a `ConnectorDefinition`
 *
 * @category Type Predicates
 *
 * @param node
 * @returns true if the node is a `ConnectorDefinition`
 */
export function isConnectorDefinition(
  node: ASTNode | null
): node is ConnectorDefinition {
  return isStructConnectorDefinition(node) || isScalarConnectorDefinition(node);
}

/**
 * A predicate to determine if a given node is a `ConnectorDefinition`
 *
 * @category Type Predicates
 *
 * @param node
 * @returns true if the node is a `ConnectorDefinition`
 */
export function isStructConnectorDefinition(
  node: ASTNode | null
): node is StructConnectorDefinition {
  return node !== null && node.kind === "strcon";
}

/**
 * A predicate to determine if a given node is a `ConnectorDefinition`
 *
 * @category Type Predicates
 * @param node
 * @returns true if the node is a `ConnectorDefinition`
 */
export function isScalarConnectorDefinition(
  node: ASTNode | null
): node is ScalarConnectorDefinition {
  return node !== null && node.kind === "sclcon";
}
