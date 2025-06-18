import { Maybe, Nothing } from "purify-ts";

/**
 * Represents the type of integer values
 */
export interface IntegerType {
  resolves: "Integer";
  guess: Maybe<number>; // Should be an integer, potentially useful for fixed point iteration?
  min: Maybe<number>; // Should be an integer!
  max: Maybe<number>; // Should be an integer!
  units: Maybe<string>;
  quantity: Maybe<string>;
  displayUnits: Maybe<string>;
}

/**
 * Create an instance of an integer type
 *
 * @returns
 */
export function integerType(
  fields: Partial<Omit<IntegerType, "resolves">>
): IntegerType {
  return {
    resolves: "Integer",
    guess: Nothing,
    min: Nothing,
    max: Nothing,
    units: Nothing,
    quantity: Nothing,
    displayUnits: Nothing,
    ...fields,
  };
}

/**
 * Predicate determines if a value is a integer type
 *
 * @param t
 * @returns
 */
export function isIntegerType(t: unknown): t is IntegerType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "Integer"
  );
}
