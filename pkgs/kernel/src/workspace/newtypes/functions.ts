import { VariableDeclarationType } from "./types.js";

/**
 * Represents a value that is a function with positional and keyword arguments.
 * This also captures the return type of the function.
 */
export interface FunctionType {
  resolves: "fun";
  positional: VariableDeclarationType[];
  keyword: Map<string, VariableDeclarationType>;
  returns: VariableDeclarationType[];
}

/** Create a `FunctionType` instance */
export function functionType(): FunctionType {
  return {
    resolves: "fun",
    positional: [],
    keyword: new Map(),
    returns: [],
  };
}

/**
 * Predicate to determine if a value is a function type
 *
 * @param t
 * @returns
 */
export function isFunctionType(t: unknown): t is FunctionType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "fun"
  );
}
