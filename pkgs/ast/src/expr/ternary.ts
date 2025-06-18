import { Expression } from "./expr.js";

/** Node to represent a ternary expression
 *
 * @category Expression Nodes
 **/
export interface TernaryExpression {
  type: "texp";
  /** The conditional expression that determines which branch to evaluate */
  cond: Expression;
  /** The branch to evaluate if the conditional expression is true */
  yes: Expression;
  /** The branch to evaluate if the conditional expression is false */
  no: Expression;
  // NB no span because we can determine the span from the expressions
}

/** Constructor for a ternary expression node
 *
 * @category Expression Nodes
 **/
export function ternaryExpression(
  cond: Expression,
  yes: Expression,
  no: Expression
): TernaryExpression {
  return {
    type: "texp",
    cond,
    yes,
    no,
  };
}

/** Predicate to determine if a given value is an instance of a `TernaryExpression`
 *
 * @category Type Predicates
 **/
export function isTernaryExpression(node: unknown) {
  return node instanceof Object && (node as TernaryExpression).type === "texp";
}
