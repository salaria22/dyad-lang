import { TextualSpan } from "./span.js";
import { ASTNode } from "./node.js";
import { Children, childObject, possibleMetadata } from "./children.js";
import { MetadataNode } from "./metadata.js";
import { DocString } from "./docs.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";
import { StructTypeDefinition } from "./struct.js";
import { SourceKey } from "./keys.js";

/** Information associated with an enum type definition
 *
 * @category AST Nodes
 */
export interface EnumTypeDefinition {
  kind: "enum";
  /** Doc string for this type */
  doc_string: Nullable<DocString>;
  /** The name of the enumerated type being defined */
  name: Token;
  /** The possible values of this enumerated type */
  cases: Record<string, StructTypeDefinition>;
  /** Metadata */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * List the children of an `EnumTypeDefinition` node
 *
 * @category Navigation
 *
 * @param def
 * @returns
 */
export function enumTypeDefinitionChildren(def: EnumTypeDefinition): Children {
  const ret: Children = possibleMetadata(def);
  const cases = childObject("cases", def);
  return { ...ret, ...cases };
}

/**
 * Constructor for an `EnumTypeDefinition` node
 *
 * @category AST Nodes
 */
export function enumTypeDefinition(
  doc_string: Nullable<DocString>,
  name: Token,
  cases: Record<string, StructTypeDefinition>,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): EnumTypeDefinition {
  return {
    kind: "enum",
    doc_string,
    name,
    cases,
    metadata,
    source,
    span,
  };
}

/** Predicate to determine if a given `ASTNode` is an instance of `EnumTypeDefinition`
 *
 * @category Type Predicates
 */
export function isEnumTypeDefinition(
  x: ASTNode | null
): x is EnumTypeDefinition {
  return x !== null && x.kind === "enum";
}
