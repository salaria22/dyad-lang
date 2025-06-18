import { VariableDeclarationType } from "./types.js";

/**
 * Represents the type of a product type with named fields.
 */
export interface StructType {
  resolves: "struct";
  fields: Map<string, VariableDeclarationType>;
}

/**
 * Create a type representing a structure
 */
export function structType(): StructType {
  return {
    resolves: "struct",
    fields: new Map(),
  };
}

/**
 * Predicate to determine if a value is a struct type
 *
 * @param t
 * @returns
 */
export function isStructType(t: unknown): t is StructType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "struct"
  );
}
