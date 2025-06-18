import { assertUnreachable } from "@juliacomputing/dyad-common";
import { BinaryExpression } from "./binary";
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
import { ArrayExpression } from "./array";
import { RangeExpression } from "./range.js";

/**
 * Closures used for mapping over an expression type
 *
 * @category Expression Nodes
 */
export interface ExpressionOperator<R> {
  arr: (node: ArrayExpression) => R;
  bexp: (node: BinaryExpression) => R;
  blit: (node: BooleanLiteral) => R;
  call: (node: FunctionCall) => R;
  cref: (node: CompRef) => R;
  ilit: (node: IntegerLiteral) => R;
  paren: (node: ParentheticalExpression) => R;
  range: (node: RangeExpression) => R;
  rlit: (node: RealLiteral) => R;
  slit: (node: StringLiteral) => R;
  texp: (node: TernaryExpression) => R;
  uexp: (node: UnaryExpression) => R;
  ulit: (node: UndefinedLiteral) => R;
}

/**
 * Function for performing mapping over an `Expression`
 *
 * @category Expression Nodes
 * @param node
 * @param op
 * @returns
 */
export function exprCase<R>(node: Expression, op: ExpressionOperator<R>) {
  switch (node.type) {
    case "arr":
      return op.arr(node);
    case "bexp":
      return op.bexp(node);
    case "blit":
      return op.blit(node);
    case "call":
      return op.call(node);
    case "cref":
      return op.cref(node);
    case "ilit":
      return op.ilit(node);
    case "paren":
      return op.paren(node);
    case "range":
      return op.range(node);
    case "rlit":
      return op.rlit(node);
    case "slit":
      return op.slit(node);
    case "texp":
      return op.texp(node);
    case "uexp":
      return op.uexp(node);
    case "ulit":
      return op.ulit(node);
    default:
      assertUnreachable(node);
  }
}
