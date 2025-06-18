import { Nullable } from "@juliacomputing/dyad-common";
import { Children, possibleMetadata } from "./children";
import { TextualSpan } from "./span";
import { DocString } from "./docs";
import { CompRef, Expression } from "../expr";
import { MetadataNode } from "./metadata";
import { ASTNode } from "./node";

/**
 * A syntax node used to represent a transition in a state machine
 *
 * @category AST Nodes
 */
export interface Transition {
  kind: "st";
  /** The state we are transitioning from */
  from: CompRef;
  /** The state we are transitioning to */
  to: CompRef;
  /** The condition(s) under which the transition will occur */
  cond: Expression;
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * List the children of a `Transition` node
 *
 * @category Navigation
 * @param transition
 * @returns
 */
export function transitionChildren(transition: Transition): Children {
  return possibleMetadata(transition);
}

/**
 * Determines if a given `ASTNode` is an instance of `Transition`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isTransition(node: ASTNode | null): node is Transition {
  return node !== null && node.kind === "st";
}
