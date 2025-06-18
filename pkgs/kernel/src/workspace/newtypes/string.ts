/**
 * Represents the type of a string value
 */
export interface StringType {
  resolves: "String";
}

/**
 * A bare `StringType` instance
 */
export const stringType: StringType = {
  resolves: "String",
};

/**
 * Predicate determines if a value is a string type
 *
 * @param t
 * @returns
 */
export function isStringType(t: unknown): t is StringType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "String"
  );
}
