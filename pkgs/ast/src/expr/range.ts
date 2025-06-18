import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "./expr.js";

/**
 * Information associated with a range expression
 *
 * @category Expression Nodes
 **/
export interface RangeExpression {
  type: "range";
  /** Value where the range starts */
  start: Expression;
  /** Value where the range ends */
  end: Expression;
  /** Value to step by (default is +1, if not provided) */
  step: Nullable<Expression>;
}

/**
 * Constructor for a range expression
 *
 * @param start
 * @param end
 * @param step
 * @returns
 */
export function rangeExpression(
  start: Expression,
  end: Expression,
  step: Nullable<Expression>
): RangeExpression {
  return {
    type: "range",
    start,
    end,
    step,
  };
}

/**
 * Predicate to determine a given value is an instance of a `RangExpression`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isRangeExpression(node: unknown) {
  return node instanceof Object && (node as RangeExpression).type === "range";
}
