import { Nullable } from "@juliacomputing/dyad-common";
import { Children, childObject, possibleMetadata } from "./children.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { StructFieldDeclaration } from "./field.js";
import { MetadataNode } from "./metadata.js";
import { ASTNode } from "./node.js";
import { Token } from "./token.js";
import { SourceKey } from "./keys.js";

/** Information associated with a struct type definition
 *
 * @category AST Nodes
 */
export interface StructTypeDefinition {
  kind: "struct";
  /** Doc string for this type */
  doc_string: Nullable<DocString>;
  /** The name of the struct type being defined */
  name: Token;
  /** Any fields present in the struct */
  fields: Record<string, StructFieldDeclaration>;
  /** Metadata */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * List the children of a `StructTypeDefinition` node
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function structTypeDefinitionChildren(
  def: StructTypeDefinition
): Children {
  const ret: Children = possibleMetadata(def);
  const fields = childObject("fields", def);

  return { ...ret, ...fields };
}

/** Constructor for a `StructTypeDefinition` instance
 *
 * @category AST Nodes
 */
export function structTypeDefinition(
  doc_string: Nullable<DocString>,
  name: Token,
  fields: Record<string, StructFieldDeclaration>,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): StructTypeDefinition {
  return {
    kind: "struct",
    doc_string,
    name,
    fields,
    metadata,
    source,
    span,
  };
}

/** Predicate to determine if a given `ASTNode` is an instance of `StructTypeDefinition`
 *
 * @category Type Predicates
 **/
export function isStructTypeDefinition(
  x: ASTNode | null
): x is StructTypeDefinition {
  return x !== null && x.kind === "struct";
}
