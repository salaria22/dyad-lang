import { Maybe, Nothing } from "purify-ts";

/**
 * Represents the type of a boolean value
 */
export interface BooleanType {
  resolves: "Boolean";
  guess: Maybe<boolean>; // Potentially useful for fixed point iteration?
  quantity: Maybe<string>;
}

/**
 * Create an instance of a boolean type
 */
export function booleanType(
  fields: Partial<Omit<BooleanType, "resolves">>
): BooleanType {
  return {
    resolves: "Boolean",
    guess: Nothing,
    quantity: Nothing,
    ...fields,
  };
}

/**
 * Predicate determines if a value is a boolean type
 *
 * @param t
 * @returns
 */
export function isBooleanType(t: unknown): t is BooleanType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "Boolean"
  );
}
