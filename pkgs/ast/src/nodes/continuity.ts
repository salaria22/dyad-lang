import { MetadataNode } from "./metadata.js";
import { CompRef } from "../expr/index.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { Children, possibleMetadata } from "./children.js";
import { ASTNode } from "./node.js";
import { Nullable } from "@juliacomputing/dyad-common";

/**
 * This is the data associated with a `path` statement
 *
 * @category AST Nodes
 */
export interface ContinuitySet {
  kind: "cont";
  /** The (optional) doc string associated with this specific connection */
  doc_string: Nullable<DocString>;
  /** References to each variable in the path set.  There must be at least two of these! */
  variables: Array<CompRef>;
  /** Any (optional) metadata associated with this connection */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

export function continuitySet(
  doc_string: Nullable<DocString>,
  variables: Array<CompRef>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): ContinuitySet {
  return {
    kind: "cont",
    doc_string,
    variables,
    metadata,
    span,
  };
}

/**
 * List the children of a `ContinuitySet` node
 *
 * @category Navigation
 * @param com
 * @returns
 */
export function continuitySetChildren(com: ContinuitySet): Children {
  return possibleMetadata(com);
}

/**
 * Determine if a given node is a `ContinuitySet`
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns true if node is a `ContinuitySet`
 */
export function isContinuitySet(node: ASTNode | null): node is ContinuitySet {
  return node !== null && node.kind === "cont";
}
