import { BooleanType } from "./boolean.js";
import { IntegerType } from "./integer.js";
import { NativeType } from "./native.js";
import { RealType } from "./real.js";
import { StringType } from "./string.js";

/**
 * The set of all scalar types
 */
export type ScalarType =
  | RealType
  | IntegerType
  | BooleanType
  | StringType
  | NativeType;

/** A type for each possible value of `resolves` in a `ScalarType` */
export type ScalarTypes = ScalarType["resolves"];

/**
 * A predicate to determine if a given value is a `ScalarType`
 *
 * @param e
 * @returns
 */
export function isScalarType(e: unknown): e is ScalarType {
  return (
    typeof e === "object" &&
    e !== null &&
    "resolves" in e &&
    (e.resolves === "Real" ||
      e.resolves === "Integer" ||
      e.resolves === "Boolean" ||
      e.resolves === "String" ||
      e.resolves === "Native")
  );
}
