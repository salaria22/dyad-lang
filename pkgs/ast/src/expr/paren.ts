import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "./expr.js";
import { TextualSpan } from "../nodes/span.js";

/**
 * Information associated with a unary expression
 *
 * @category Expression Nodes
 **/
export interface ParentheticalExpression {
  type: "paren";
  /** Expression the unary operator is being applied to */
  expr: Expression;
  /** Span of the parens */
  span: Nullable<TextualSpan>;
}

/**
 * Constructor for a unary expression
 *
 * @category Expression Nodes
 **/
export function parenExpr(
  expr: Expression,
  span: Nullable<TextualSpan>
): ParentheticalExpression {
  return {
    type: "paren",
    expr,
    span,
  };
}

/**
 * Predicate to determine if a given value is an instance of a `ParentheticalExpression`
 *
 * @category Type Predicates
 **/
export function isParentheticalExpression(node: unknown) {
  return (
    node instanceof Object && (node as ParentheticalExpression).type === "paren"
  );
}
