import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "./expr.js";
import { CompRef } from "./refs.js";
import { TextualSpan } from "../nodes/span.js";

/** Information associated with a function call
 *
 * @category Expression Nodes
 **/
export interface FunctionCall {
  type: "call";
  /** The "name" of the function being invoked (could be a component reference) */
  func: CompRef;
  /** Any positional arguments to the function */
  positional: Expression[];
  /** Any keyword arguments to the function */
  keyword: Record<string, Expression>;
  /** Span of the function invocation */
  span: Nullable<TextualSpan>;
}

/** This function constructs a `FunctionCall` node
 *
 * @category Expression Nodes
 **/
export function functionCall(
  func: CompRef,
  positional: Expression[],
  keyword: Record<string, Expression>,
  span: Nullable<TextualSpan>
): FunctionCall {
  return {
    type: "call",
    func,
    positional,
    keyword,
    span,
  };
}

/** Predicate to determine if a given value is an instance of a `FunctionCall`
 *
 * @category Type Predicates
 **/
export function isFunctionCall(node: unknown) {
  return node instanceof Object && (node as FunctionCall).type === "call";
}
