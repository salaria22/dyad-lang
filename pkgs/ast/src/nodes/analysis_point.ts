import { MetadataNode } from "./metadata.js";
import { CompRef } from "../expr/index.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { Children, possibleMetadata } from "./children.js";
import { ASTNode } from "./node.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";

/**
 * This is the data associated with an individual connection.
 *
 * @category AST Nodes
 */
export interface AnalysisPoint {
  kind: "ap";
  /** Name (required for analysis points) */
  name: Token;
  /** References to each connector in the connection set.  There must be at least two of these! */
  connectors: Array<CompRef>;
  /** The (optional) doc string associated with this specific connection */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this connection */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

export function analysisPoint(
  name: Token,
  connectors: Array<CompRef>,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): AnalysisPoint {
  return {
    kind: "ap",
    name,
    connectors,
    doc_string,
    metadata,
    span,
  };
}

/**
 * List the children of an `AnalysisPoint` node
 *
 * @category Navigation
 * @param con
 * @returns
 */
export function analysisPointChildren(ap: AnalysisPoint): Children {
  return possibleMetadata(ap);
}

/**
 * Determine if a given node is an `AnalysisPoint` node
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns true if node is an `AnalysisPoint`
 */
export function isAnalysisPoint(node: ASTNode | null): node is AnalysisPoint {
  return node !== null && node.kind === "ap";
}
