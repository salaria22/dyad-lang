import { Nullable } from "@juliacomputing/dyad-common";
import { TextualSpan, boundingSpan } from "../nodes";
import { ArrayExpression } from "./array";
import { BinaryExpression } from "./binary";
import { exprCase } from "./case";
import { Expression } from "./expr";
import { FunctionCall } from "./fcall";
import {
  BooleanLiteral,
  IntegerLiteral,
  RealLiteral,
  StringLiteral,
  UndefinedLiteral,
} from "./literals";
import { ParentheticalExpression } from "./paren";
import { CompRef } from "./refs";
import { TernaryExpression } from "./ternary";
import { UnaryExpression } from "./unary";
import { RangeExpression } from "./range.js";

/**
 * Compute the span of a given expression
 *
 * @category Structured Data
 *
 * @param expr Expression to compute the span of
 * @returns
 */
export function expressionSpan(expr: Expression): Nullable<TextualSpan> {
  return exprCase(expr, {
    arr: function (node: ArrayExpression) {
      return node.span;
    },
    bexp: function (node: BinaryExpression) {
      return boundingSpan([expressionSpan(node.lhs), expressionSpan(node.rhs)]);
    },
    blit: function (node: BooleanLiteral) {
      return node.span;
    },
    call: function (node: FunctionCall) {
      return node.span;
    },
    cref: function (node: CompRef) {
      return boundingSpan(node.elems.map((e) => e.span));
    },
    ilit: function (node: IntegerLiteral) {
      return node.span;
    },
    paren: function (node: ParentheticalExpression) {
      return node.span;
    },
    range: function (node: RangeExpression) {
      const exprs: Expression[] = [node.start, node.end];
      if (node.step) {
        exprs.push(node.step);
      }
      return boundingSpan(exprs.map(expressionSpan));
    },
    rlit: function (node: RealLiteral) {
      return node.span;
    },
    slit: function (node: StringLiteral) {
      return node.span;
    },
    texp: function (node: TernaryExpression) {
      return boundingSpan([node.cond, node.yes, node.no].map(expressionSpan));
    },
    uexp: function (node: UnaryExpression) {
      return node.span;
    },
    ulit: function (node: UndefinedLiteral) {
      return node.span;
    },
  });
}
