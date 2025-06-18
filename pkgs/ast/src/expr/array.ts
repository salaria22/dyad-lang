import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "./expr.js";
import { TextualSpan } from "../nodes/span.js";

/**
 * Information associated with a unary expression
 *
 * @category Expression Nodes
 **/
export interface ArrayExpression {
  type: "arr";
  /** Contents of the array (potentially empty) */
  contents: Expression[];
  /** Span of the array constructor */
  span: Nullable<TextualSpan>;
}

/**
 * Constructor for a unary expression
 *
 * @category Expression Nodes
 *
 **/
export function arrayExpr(
  contents: Expression[],
  span: Nullable<TextualSpan>
): ArrayExpression {
  return {
    type: "arr",
    contents,
    span,
  };
}

/** Predicate to determine if a given value is an instance of a `ArrayExpression`
 *
 * @category Type Predicates
 **/
export function isArrayExpression(node: unknown) {
  return node instanceof Object && (node as ArrayExpression).type === "arr";
}
