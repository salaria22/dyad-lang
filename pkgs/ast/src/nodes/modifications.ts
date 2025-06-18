import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "../expr/expr.js";
import { TextualSpan } from "./span.js";

/**
 * Represents the potential changes that could be applied to a single attribute
 */
export interface Modification {
  final: boolean;
  expr: Nullable<Expression>;
  nested: Nullable<Modifications>;
  span: Nullable<TextualSpan>;
}

export type ModificationWithExpression = Omit<Modification, "expr"> & {
  expr: Expression;
};

export type ModificationWithOnlyExpression = Omit<
  Modification,
  "expr" | "nested"
> & {
  expr: Expression;
  nested: null;
};

export type NestedModification = Omit<Modification, "nested"> & {
  nested: Modifications;
};

/** Create an instance of a `Modification` */
export function modification(
  final: boolean,
  expr: Nullable<Expression>,
  nested: Nullable<Modifications>,
  span: Nullable<TextualSpan>
): Modification {
  return { final, expr, nested, span };
}

/** Predicate indicating whether a `Modification` has an expression */
export function hasExpression(
  mod: Modification
): mod is ModificationWithExpression {
  return mod.expr !== null;
}

/** Predicate indicating whether a `Modification` has any nested modifications */
export function hasNested(mod: Modification): mod is NestedModification {
  return mod.nested !== null;
}

export function hasOnlyExpression(
  mod: Modification
): mod is ModificationWithOnlyExpression {
  return mod.nested === null && mod.expr !== null;
}

/**
 * Create an instance if a `Modification` that applies an expression but doesn't include any nested modifications
 * @param expr
 * @returns
 */
export function assignmod(expr: Expression, final: boolean): Modification {
  return { final, expr, nested: null, span: null };
}

/**
 * Modifications are simply key value pairs where the key is a string and the
 * value is an expression.
 *
 * @category Structured Data
 *
 */
export type Modifications = Record<string, Modification>;
