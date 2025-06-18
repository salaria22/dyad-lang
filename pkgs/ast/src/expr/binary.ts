import { Expression } from "./expr.js";

/** Possible binary operators (whether they are element-wise is specified independently)
 *
 * @category Expression Nodes
 */
export type BinaryOperator =
  | "+"
  | "-"
  | "%"
  | "or"
  | "and"
  | "*"
  | "/"
  | ">"
  | ">="
  | "=="
  | "!="
  | "<="
  | "<"
  | "^";

/** Information associated with a binary expressions
 *
 * @category Expression Nodes
 **/
export interface BinaryExpression {
  type: "bexp";
  /** The expression on the left side of the operator */
  lhs: Expression;
  /** The operator found in the binary expression */
  op: BinaryOperator;
  /** Whether the operator should be applied elementwise */
  elementwise: boolean;
  /** The expression on the right side of the operator */
  rhs: Expression;
  // NB - There is no span here because we can determine it from the span
  // of the LHS and RHS.
}

/** Constructor for binary expressions
 *
 * @category Expression Nodes
 **/
export function binaryExpr(
  lhs: Expression,
  op: BinaryOperator,
  elementwise: boolean,
  rhs: Expression
): BinaryExpression {
  return {
    type: "bexp",
    lhs,
    op,
    rhs,
    elementwise,
  };
}

/** Predicate to determine if a given value is an instance of a `BinaryExpression`
 *
 * @category Type Predicates
 **/
export function isBinaryExpression(node: unknown) {
  return node instanceof Object && (node as BinaryExpression).type === "bexp";
}
