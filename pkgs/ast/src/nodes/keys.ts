import { isObject } from "@juliacomputing/dyad-common";

/**
 * Possible types of keys
 *
 * @category Keys
 */
export type FileKey = SourceKey | AssetKey;

/**
 * Refers to a specific source file in a specific module
 *
 * @category Keys
 */
export interface SourceKey {
  kind: "src";
  file: string;
  mod: string[];
}

/**
 * Constructs a `SourceKey` instance
 *
 * @category Keys
 *
 * @param file Referenced file
 * @param module Module containing referenced file
 * @returns An instance of `SourceKey`
 */
export function sourceKey(file: string, module: string[]): SourceKey {
  return {
    kind: "src",
    file,
    mod: module,
  };
}

/**
 * Type predicate to identify `SourceKey`s
 *
 * @category Type Predicates
 *
 * @param x A `FileKey` instance
 * @returns true if this `x` is a `SourceKey`
 */
export function isSourceKey(x: any): x is SourceKey {
  const obj = x;
  if (isObject(obj)) {
    const kind = obj.kind;
    const file = obj.file;
    const mod = obj.mod;
    return (
      kind === "src" && typeof file === "string" && typeof mod === "object"
    );
  }
  return false;
}

/**
 * Refers to a specific asset file
 *
 * @category Keys
 */
export interface AssetKey {
  kind: "asset";
  file: string;
}

/**
 * Constructs an `AssetKey` instance
 *
 * @category Keys
 *
 * @param file Asset file
 * @returns An instance of `AssetKey`
 */
export function assetKey(file: string): AssetKey {
  return {
    kind: "asset",
    file,
  };
}

/**
 * Type predicate to identify `AssetKey`s
 *
 * @category Type Predicates
 *
 * @param x A `FileKey` instance
 * @returns true if this `x` is a `AssetKey`
 */
export function isAssetKey(x: FileKey): x is AssetKey {
  const obj = x;
  if (isObject(obj)) {
    const kind = obj.kind;
    const file = obj.file;
    return kind === "src" && typeof file === "string";
  }
  return false;
}

/**
 * Type predicate to identify `FileKey`s
 *
 * @category Type Predicates
 *
 * @param x Any Javascript value
 * @returns true if this `x` is a `FileKey`
 */
export function isFileKey(x: any): x is FileKey {
  return isSourceKey(x) || isAssetKey(x);
}

/**
 * Interface type for handling mapping of `FileKey`s
 *
 * @category Keys
 *
 */
export interface KeyCases<R> {
  source: (file: string, module: string[]) => R;
  asset: (file: string) => R;
}

/**
 * A function that performs a map operation over `FileKeys`
 * @see KeyCases
 * @category Keys
 *
 * @param key The `FileKey` to map over`
 * @param cases Closures to handle the two possible cases
 * @returns The result of applying the mapping function
 */
export function switchKey<T>(key: FileKey, cases: KeyCases<T>) {
  if (key.kind === "src") {
    return cases.source(key.file, key.mod);
  } else {
    return cases.asset(key.file);
  }
}

/**
 * A function to determine if two keys are equal (_i.e.,_ refer to the same
 * file)
 *
 * @category Keys
 * @param a One `FileKey` instance
 * @param b Another `FileKey` instance
 * @returns true if `a` and `b` refer to the same file
 */
export function sameKey(a: FileKey, b: FileKey): boolean {
  return switchKey(a, {
    source: (file, mod) => {
      return (
        b.kind === "src" &&
        b.file === file &&
        mod.length === b.mod.length &&
        mod.every((path, i) => path === b.mod[i])
      );
    },
    asset: (file) => {
      return b.kind === "asset" && b.file === file;
    },
  });
}
