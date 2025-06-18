import { Nullable } from "@juliacomputing/dyad-common";
import { Children } from "./children.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { MetadataNode } from "./metadata.js";
import { ASTNode } from "./node.js";
import { QualifiedType } from "./qualifier.js";
import { Token } from "./token.js";
import { SourceKey } from "./keys.js";

/** Information associated with the definition of a scalar type
 *
 * @category AST Nodes
 */
export interface ScalarTypeDefinition {
  kind: "scalar";
  /** Doc string for this type */
  doc_string: Nullable<DocString>;
  /** The name of the scalar type being defined */
  name: Token;
  /** The class that this scalar type extends from (ultimately must be a builtin type) */
  base: QualifiedType;
  /** Metadata */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * List the children of a `ScalarTypeDefinition` node
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function scalarTypeDefinitionChildren(
  def: ScalarTypeDefinition
): Children {
  return { base: def.base };
}

/** Constructor for a `ScalarTypeDefinition` node
 *
 * @category AST Nodes
 */
export function scalarTypeDefinition(
  doc_string: Nullable<DocString>,
  name: Token,
  base: QualifiedType,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): ScalarTypeDefinition {
  return {
    kind: "scalar",
    doc_string,
    name,
    base,
    metadata,
    source,
    span,
  };
}

/** Predicate to determine if a given `ASTNode` is an instance of `ScalarTypeDefinition`
 *
 * @category Type Predicates
 **/
export function isScalarTypeDefinition(
  node: ASTNode | null
): node is ScalarTypeDefinition {
  return node !== null && node.kind === "scalar";
}
