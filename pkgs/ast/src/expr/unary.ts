import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "./expr.js";
import { TextualSpan } from "../nodes/span.js";

/** Possible unary operators
 *
 * @category Expression Nodes
 */
export type UnaryOperator = "not" | "-" | "+";

/** Information associated with a unary expression
 *
 * @category Expression Nodes
 **/
export interface UnaryExpression {
  type: "uexp";
  /** Unary operator being applied */
  op: UnaryOperator;
  /** Whether the operator is applied elementwise */
  elementwise: boolean;
  /** Expression the unary operator is being applied to */
  rhs: Expression;
  /** Span of this expression */
  span: Nullable<TextualSpan>;
}

/** Constructor for a unary expression
 *
 * @category Expression Nodes
 **/
export function unaryExpr(
  op: UnaryOperator,
  elementwise: boolean,
  rhs: Expression,
  span: Nullable<TextualSpan>
): UnaryExpression {
  return {
    type: "uexp",
    op,
    rhs,
    elementwise,
    span,
  };
}

/** Predicate to determine if a given value is an instance of a `UnaryExpression`
 *
 * @category Type Predicates
 **/
export function isUnaryExpression(node: unknown): node is UnaryExpression {
  return node instanceof Object && (node as UnaryExpression).type === "uexp";
}
