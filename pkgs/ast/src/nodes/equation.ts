import { DocString } from "./docs.js";
import { Expression } from "../expr/expr.js";
import { MetadataNode } from "./metadata.js";
import { TextualSpan } from "./span.js";
import { Children, possibleMetadata } from "./children.js";
import { ASTNode } from "./node.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";

/**
 * The representation of a mathematical equations in Dyad
 *
 * @category AST Nodes
 */
export interface Equation {
  kind: "eq";
  /** Indicates whether this equation is applied only when finding initial conditions */
  initial: boolean;
  /** If the equation is conditional on something (like a clock), this is an expression to represent that condition. */
  when: Nullable<Expression>; // Links this equation to a clock
  /** Name (if named) */
  name: Nullable<Token>;
  /** Expression for the left side (potentially multi-dimensional) */
  lhs: Expression;
  /** Expression for the right side (potentially multi-dimensional) */
  rhs: Expression;
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * This function constructs an `Equation` node
 *
 * @category AST Nodes
 * @param initial
 * @param when
 * @param name
 * @param lhs
 * @param rhs
 * @param doc_string
 * @param metadata
 * @param span
 * @returns
 */
export function equation(
  initial: boolean,
  when: Nullable<Expression>,
  name: Nullable<Token>,
  lhs: Expression,
  rhs: Expression,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): Equation {
  return {
    kind: "eq",
    initial,
    when,
    name,
    lhs,
    rhs,
    doc_string,
    metadata,
    span,
  };
}

/**
 * List the children of an `Equation` node
 *
 * @category Navigation
 * @param eq
 * @returns Child nodes
 */
export function equationChildren(eq: Equation): Children {
  return possibleMetadata(eq);
}

/**
 * Determine if a given node is an instance of `Equation`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isEquation(node: ASTNode | null): node is Equation {
  return node !== null && node.kind === "eq";
}
