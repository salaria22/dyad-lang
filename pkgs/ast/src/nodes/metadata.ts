import { Children } from "./children";
import { TextualSpan } from "./span";
import { ASTNode } from "./node";
import { Nullable } from "@juliacomputing/dyad-common";

/**
 * Types found in a JSON representation
 *
 * @category JSON Values
 **/
export type JSONValue =
  | string
  | number
  | boolean
  | JSONObject
  | null
  | JSONArray;

/** Type of a JSON object
 *
 * @category JSON Values
 **/
export interface JSONObject {
  [x: string]: JSONValue;
}

/**
 * Type of a JSON array.  This has to be defined this way in order to avoid
 * deep type recursion when the TypeScript compiler tries to reason about this
 * type.
 *
 * @category JSON Values
 **/
export interface JSONArray extends Array<JSONValue> {}

/** Dyad metadata is simply a JSON object */
//export type Metadata = JSONObject;

/** Name for the Dyad namespace in metadata
 *
 * @category Constants
 */
export const dyadNamespace = "Dyad";

/**
 * A node in the abstract syntax used to represent metadata
 *
 * @category AST Nodes
 */
export interface MetadataNode {
  kind: "meta";
  value: JSONObject;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * Create a metadata node
 *
 * @category AST Nodes
 * @param value Metadata value
 * @param span Span of metadata in the AST
 *
 * @returns Instance of `MetadataNode`
 */
export function metadataNode(
  value: JSONObject,
  span: Nullable<TextualSpan>
): MetadataNode {
  return { kind: "meta", value, span };
}

/**
 * Lists the children of a `MetadataNode`
 *
 * @category Navigation
 * @param node
 * @returns
 */
export function metadataNodeChildren(node: MetadataNode): Children {
  return {};
}

/**
 * Determine if a given `ASTNode` is an instance of ` MetadataNode`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isMetadataNode(node: ASTNode | null): node is MetadataNode {
  return node !== null && node.kind === "meta";
}
