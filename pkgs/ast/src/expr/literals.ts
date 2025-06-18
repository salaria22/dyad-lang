import { Nullable } from "@juliacomputing/dyad-common";
import { TextualSpan } from "../nodes/span";

/**
 * Representation of an integer literal
 *
 * @category Expression Nodes
 **/
export interface IntegerLiteral {
  type: "ilit";
  /** The metric prefix found in the parsed text (@see prefixFactors) */
  prefix: Nullable<string>;
  /** Actual value of the literal...must be an integer! */
  value: number;
  /** Original string representation (because the same value can be represented multiple ways) */
  repr: string;
  /** Span of the literal */
  span: Nullable<TextualSpan>;
}

/**
 * Function to construct an `IntegerLiteral` node.
 *
 * @category Expression Nodes
 **/
export function integerLiteral(
  value: number,
  prefix: Nullable<string>,
  span: Nullable<TextualSpan>,
  repr: string | null
): IntegerLiteral {
  return { type: "ilit", value, prefix, span, repr: repr ?? `${value}` };
}

/** Representation of a real literal
 *
 * @category Expression Nodes
 **/
export interface RealLiteral {
  type: "rlit";
  /** The metric prefix found in the parsed text (@see prefixFactors) */
  prefix: Nullable<string>;
  /** Actual value of the literal */
  value: number;
  /** Original string representation (because the same value can be represented multiple ways) */
  repr: string;
  /** Span of the literal */
  span: Nullable<TextualSpan>;
}

/** Function to construct a `RealLiteral` node
 *
 * @category Expression Nodes
 **/
export function realLiteral(
  value: number,
  prefix: Nullable<string>,
  span: Nullable<TextualSpan>,
  repr: string | null
): RealLiteral {
  return { type: "rlit", value, prefix, span, repr: repr ?? `${value}` };
}

/** A type to represent undefined values in an expression
 *
 * @category Expression Nodes
 **/
export interface UndefinedLiteral {
  type: "ulit";
  /** Span of the literal */
  span: Nullable<TextualSpan>;
}
/** A singleton node representing an undefined literal
 *
 * @category Expression Nodes
 **/
export function undefinedLiteral(
  span: Nullable<TextualSpan>
): UndefinedLiteral {
  return { type: "ulit", span };
}

/** Representation of a boolean literal value
 *
 * @category Expression Nodes
 **/
export interface BooleanLiteral {
  type: "blit";
  value: boolean;
  /** Span of the literal */
  span: Nullable<TextualSpan>;
}

/** Function to construct a boolean literal node
 *
 * @category Expression Nodes
 **/
export function booleanLiteral(
  value: boolean,
  span: Nullable<TextualSpan>
): BooleanLiteral {
  return { type: "blit", value, span };
}

/** Representation of a string literal value
 *
 * @category Expression Nodes
 **/
export interface StringLiteral {
  type: "slit";
  /** Unquoted string value */
  value: string;
  /** Indicates if the original parsed value was (triple?) quoted */
  quoted: boolean;
  /** Span of the literal */
  span: Nullable<TextualSpan>;
}

/** Function to construct a string literal node
 *
 * @category Expression Nodes
 **/
export function stringLiteral(
  value: string,
  quoted: boolean,
  span: Nullable<TextualSpan>
): StringLiteral {
  return { type: "slit", value, quoted, span };
}

/** Predicate to determine if a given value is an instance of a `StringLiteral`
 *
 * @category Type Predicates
 **/
export function isStringLiteral(a: unknown): a is StringLiteral {
  return a instanceof Object && (a as StringLiteral).type === "slit";
}

/** Predicate to determine if a given value is an instance of a `IntegerLiteral`
 *
 * @category Type Predicates
 **/
export function isIntegerLiteral(a: unknown): a is IntegerLiteral {
  return a instanceof Object && (a as IntegerLiteral).type === "ilit";
}

/** Predicate to determine if a given value is an instance of a `RealLiteral`
 *
 * @category Type Predicates
 **/
export function isRealLiteral(a: unknown): a is RealLiteral {
  return a instanceof Object && (a as RealLiteral).type === "rlit";
}

/** Predicate to determine if a given value is an instance of a `BooleanLiteral`
 *
 * @category Type Predicates
 **/
export function isBooleanLiteral(a: unknown): a is BooleanLiteral {
  return a instanceof Object && (a as BooleanLiteral).type === "blit";
}

/** Predicate to determine if a given value is an instance of a `BooleanLiteral`
 *
 * @category Type Predicates
 **/
export function isUndefinedLiteral(a: unknown): a is UndefinedLiteral {
  return a instanceof Object && (a as UndefinedLiteral).type === "ulit";
}

/** Predicate to determine if a given value is an instance of a `RealLiteral` or `IntegerLiteral`
 *
 * @category Type Predicates
 **/
export function isNumericLiteral(a: unknown) {
  return isIntegerLiteral(a) || isRealLiteral(a);
}
