import { Expression } from "@juliacomputing/dyad-ast";

/**
 * This is a type constructor for conditionally declared values.
 */
export interface ConditionalDeclaration<T> {
  resolves: "cond";
  elementTypes: T;
  cond: Expression;
}

/**
 * Create a type expression that constructs a conditional declaration type
 *
 * @param elem The type of the conditionally declared value
 * @param size The conditional on which the declaration depends
 * @returns
 */
export function conditionalDeclaration<T>(
  elem: T,
  cond: Expression
): ConditionalDeclaration<T> {
  return {
    resolves: "cond",
    elementTypes: elem,
    cond,
  };
}

/**
 * Predicate to determine if a value is a conditional declaration type
 *
 * @param t
 * @returns
 */
export function isComponentDeclaration(
  t: unknown
): t is ConditionalDeclaration<unknown> {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "cond"
  );
}
