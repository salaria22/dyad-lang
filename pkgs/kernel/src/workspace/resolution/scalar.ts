import { ScalarTypeDefinition } from "@juliacomputing/dyad-ast";
import { Selector } from "../selector.js";
import { Result, successfulResult } from "@juliacomputing/dyad-common";
import {
  booleanType,
  integerType,
  nativeType,
  realType,
  ScalarType,
  stringType,
} from "../newtypes/index.js";
import { BuiltinEntity, unparseBuiltinEntity } from "../entities/builtin.js";
import { applyModificationToScalarType } from "../modifications/index.js";
import { isScalarType } from "../newtypes/index.js";
import { CompilerAssertionError } from "../errors.js";
import { resolveQualifiedType } from "./qualified.js";

/**
 * This function takes a given `ScalarTypeDefinition` and formulates
 * a representation of that entity's type.
 * @param node
 * @param entity
 * @returns
 */
export function resolveScalarType(
  node: ScalarTypeDefinition
): Selector<Result<ScalarType>> {
  return ({ query }) => {
    const baseType = query(
      resolveQualifiedType(node.base, node, isScalarType, "a scalar type")
    );
    // At this point, we have a scalar type so let's now apply the modification
    // associated with the `extends` clause to it and return the result.
    return baseType.chain((t) =>
      applyModificationToScalarType(t, node.base.mods ?? {}, node)
    );
  };
}

/**
 * Transform a BuiltinEntity into a type representation.  This is
 * pretty trivial since we just return the simplest possible
 * representation for each type.
 *
 * @param e
 * @returns
 */
export function resolveBuiltinEntityType(e: BuiltinEntity): Result<ScalarType> {
  const { name } = unparseBuiltinEntity(e);
  switch (name) {
    case "Real":
      return successfulResult(realType({}));
    case "Integer":
      return successfulResult(integerType({}));
    case "String":
      return successfulResult(stringType);
    case "Boolean":
      return successfulResult(booleanType({}));
    case "Native":
      return successfulResult(nativeType);
    /* istanbul ignore next */
    default:
      throw new CompilerAssertionError(
        "resolveBuiltinEntityType",
        `resolveBuiltinEntityType entity ${e} which refers to non-existent built-in type ${name}`
      );
  }
}
