import { Maybe, Nothing } from "purify-ts/Maybe";

/**
 * Represents the type of real values
 */
export interface RealType {
  resolves: "Real";
  guess: Maybe<number>;
  statePriority: Maybe<number>;
  min: Maybe<number>;
  max: Maybe<number>;
  units: Maybe<string>;
  quantity: Maybe<string>;
  displayUnits: Maybe<string>;
}

/**
 * Create an instance of a Real type
 *
 * @returns
 */
export function realType(
  fields: Partial<Omit<RealType, "resolves">>
): RealType {
  return {
    resolves: "Real",
    guess: Nothing,
    statePriority: Nothing,
    min: Nothing,
    max: Nothing,
    units: Nothing,
    quantity: Nothing,
    displayUnits: Nothing,
    ...fields,
  };
}

/**
 * Predicate determines if a value is a real type
 *
 * @param t
 * @returns
 */
export function isRealType(t: unknown): t is RealType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "Real"
  );
}
