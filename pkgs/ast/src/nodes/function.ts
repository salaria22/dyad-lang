import { Nullable } from "@juliacomputing/dyad-common";
import { Children, possibleMetadata } from "./children";
import { TextualSpan } from "./span";
import { DocString } from "./docs";
import { MetadataNode } from "./metadata";
import { ASTNode } from "./node";
import { QualifiedType } from "./qualifier";
import { Token } from "./token";
import { SourceKey } from "./keys.js";

/** Information about function types
 *
 * @category AST Nodes
 **/
export interface FunctionTypeDefinition {
  kind: "fun";
  /** Doc string for this type */
  doc_string: Nullable<DocString>;
  /** Name of the function type */
  name: Token;
  /** Type names for positional arguments */
  positional: QualifiedType[];
  /** Argument names and associated types for keyword arguments */
  keyword: Record<string, QualifiedType>;
  /** Type of the return value */
  returns: QualifiedType[];
  /** Metadata associated with the function */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * List the children of a `FunctionTypeDefinition` node
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function functionTypeDefinitionChildren(
  def: FunctionTypeDefinition
): Children {
  return possibleMetadata(def);
}

/** Constructor for `FunctionTypeDefinition` instance
 *
 * @category AST Nodes
 */
export function functionTypeDefinition(
  doc_string: Nullable<DocString>,
  name: Token,
  positional: QualifiedType[],
  keyword: Record<string, QualifiedType>,
  returns: QualifiedType[],
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): FunctionTypeDefinition {
  return {
    kind: "fun",
    doc_string,
    name,
    positional,
    keyword,
    returns,
    metadata,
    source,
    span,
  };
}

/**
 * Determine if a given `ASTNode` is an instance of `FunctionTypeDefinition`
 *
 * @category Type Predicates
 * @param x
 * @returns
 */
export function isFunctionTypeDefinition(
  x: ASTNode | null
): x is FunctionTypeDefinition {
  return x !== null && x.kind === "fun";
}
