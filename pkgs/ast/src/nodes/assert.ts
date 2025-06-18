import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "../expr/index.js";
import { MetadataNode } from "./metadata.js";
import { DocString } from "./docs.js";
import { TextualSpan } from "./span.js";
import { Children, possibleMetadata } from "./children.js";
import { ASTNode } from "./node.js";

export interface Assertion {
  kind: "assert";
  /** Expression that must be true for the assertion to be satisified */
  expr: Expression;
  /** Message to display if assertion is violated */
  message: string;
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * A constructor function used to build an assertion definition
 *
 * @category AST Nodes
 *
 * @param doc_string
 * @param expr
 * @param message
 * @param metadata
 * @param span
 * @returns
 */
export function assertion(
  doc_string: Nullable<DocString>,
  expr: Expression,
  message: string,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): Assertion {
  return {
    kind: "assert",
    expr,
    message,
    doc_string,
    metadata,
    span,
  };
}

/**
 * List the children of an `Assertion` node
 *
 * @category Navigation
 * @param assertion
 * @returns
 */
export function assertionChildren(assertion: Assertion): Children {
  return possibleMetadata(assertion);
}

/**
 * Determines if a given `ASTNode` is an instance of `Assertion`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isAssertion(node: ASTNode | null): node is Assertion {
  return node !== null && node.kind === "assert";
}
