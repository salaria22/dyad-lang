import { StructType } from "./struct.js";

/**
 * This represents a collection of mutually exclusive possibilities
 */
export interface EnumType {
  resolves: "enum";
  options: Map<string, StructType>;
}

/**
 * Create a type that represents a collection of mutually exclusive possibilities
 *
 * @returns
 */
export function enumType(): EnumType {
  return {
    resolves: "enum",
    options: new Map(),
  };
}

/**
 * Predicate to determine if a value is an enum type
 *
 * @param t
 * @returns
 */
export function isEnumType(t: unknown): t is EnumType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "enum"
  );
}
