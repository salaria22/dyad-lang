import { MetadataNode } from "./metadata.js";
import { CompRef } from "../expr/index.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { Children, possibleMetadata } from "./children.js";
import { ASTNode } from "./node.js";
import { Nullable } from "@juliacomputing/dyad-common";

/**
 * This is the data associated with an individual connection.
 *
 * @category AST Nodes
 */
export interface Connection {
  kind: "cxn";
  /** The (optional) doc string associated with this specific connection */
  doc_string: Nullable<DocString>;
  /** References to each connector in the connection set.  There must be at least two of these! */
  connectors: Array<CompRef>;
  /** Any (optional) metadata associated with this connection */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

export function connection(
  doc_string: Nullable<DocString>,
  connectors: Array<CompRef>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): Connection {
  return {
    kind: "cxn",
    doc_string,
    connectors,
    metadata,
    span,
  };
}

/**
 * List the children of a `Connection` node
 *
 * @category Navigation
 * @param con
 * @returns
 */
export function connectionChildren(con: Connection): Children {
  return possibleMetadata(con);
}

/**
 * Determine if a given node is a `ConnectionNode`
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns true if node is a `ConnectionNode`
 */
export function isConnection(node: ASTNode | null): node is Connection {
  return node !== null && node.kind === "cxn";
}
