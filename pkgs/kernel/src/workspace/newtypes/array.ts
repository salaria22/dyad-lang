import { Expression } from "@juliacomputing/dyad-ast";

/**
 * This is a type constructor for building complex type expressions.
 */
export interface ArrayOf<T> {
  resolves: "array";
  elementTypes: T;
  sizes: Array<Expression>;
}

/**
 * Create a type expression that constructs an array type
 *
 * @param elem The type of each element in the array
 * @param size The size of the array
 * @returns
 */
export function arrayOf<T>(elem: T, sizes: Array<Expression>): ArrayOf<T> {
  return {
    resolves: "array",
    elementTypes: elem,
    sizes,
  };
}

/**
 * Predicate to determine if a value is an array type
 *
 * @param t
 * @returns
 */
export function isArrayOf(t: unknown): t is ArrayOf<unknown> {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "array"
  );
}
