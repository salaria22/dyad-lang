/**
 * Represents the type of a native Julia value
 */
export interface NativeType {
  resolves: "Native";
}

/**
 * A bare `NativeType` instance
 */
export const nativeType: NativeType = {
  resolves: "Native",
};

/**
 * Predicate determines if a value is a native type
 *
 * @param t
 * @returns
 */
export function isNativeType(t: unknown): t is NativeType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "Native"
  );
}
