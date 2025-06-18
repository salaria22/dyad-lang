import { Nothing } from "purify-ts/Maybe";
import { builtinTypes, qualifiedName } from "@juliacomputing/dyad-ast";
import { CompilerAssertionError } from "../errors.js";
import { resolvedScalar, ResolvedScalarType } from "./scalar.js";

/**
 * This function creates a map that maps builtin type names into resolved types.
 * @returns
 */
export function computeBuiltinScope() {
  const table = new Map<string, ResolvedScalarType>();
  // Inject built-in types
  for (const bt of builtinTypes) {
    const entry = resolvedScalar(bt, Nothing, null, { ...bt.mods });
    /* istanbul ignore next */
    if (bt.name.length !== 1) {
      throw new CompilerAssertionError(
        qualifiedName(bt),
        `Expected only simple type names for builtins, got ${qualifiedName(bt)}`
      );
    }
    table.set(bt.name[0].value, entry);
  }
  return table;
}
