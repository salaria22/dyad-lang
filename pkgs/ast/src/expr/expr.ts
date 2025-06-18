import { ArrayExpression, isArrayExpression } from "./array.js";
import { BinaryExpression, isBinaryExpression } from "./binary.js";
import { FunctionCall, isFunctionCall } from "./fcall.js";
import {
  IntegerLiteral,
  RealLiteral,
  StringLiteral,
  BooleanLiteral,
  UndefinedLiteral,
  isIntegerLiteral,
  isRealLiteral,
  isBooleanLiteral,
  isStringLiteral,
  isUndefinedLiteral,
} from "./literals.js";
import { isParentheticalExpression, ParentheticalExpression } from "./paren.js";
import { isRangeExpression, RangeExpression } from "./range.js";
import { CompRef, isCompRef } from "./refs.js";
import { isTernaryExpression, TernaryExpression } from "./ternary.js";
import { isUnaryExpression, UnaryExpression } from "./unary.js";

/** List of all possible expression types
 *
 * @category Expression Nodes
 **/
export type Expression =
  | IntegerLiteral
  | RealLiteral
  | BooleanLiteral
  | StringLiteral
  | UndefinedLiteral
  | BinaryExpression
  | ArrayExpression
  | ParentheticalExpression
  | UnaryExpression
  | TernaryExpression
  | FunctionCall
  | RangeExpression
  | CompRef;

/** Predicate to determine if a given value is an instance of an `Expression`
 *
 * @category Type Predicates
 **/
export function isExpression(node: unknown) {
  return (
    isIntegerLiteral(node) ||
    isRealLiteral(node) ||
    isBooleanLiteral(node) ||
    isStringLiteral(node) ||
    isUndefinedLiteral(node) ||
    isBinaryExpression(node) ||
    isArrayExpression(node) ||
    isParentheticalExpression(node) ||
    isUnaryExpression(node) ||
    isTernaryExpression(node) ||
    isFunctionCall(node) ||
    isRangeExpression(node) ||
    isCompRef(node)
  );
}
