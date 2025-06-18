import {
  Definition,
  StructFieldDeclaration,
  StructTypeDefinition,
} from "@juliacomputing/dyad-ast";
import { Selector } from "../selector.js";
import { partialResult, Problem, Result } from "@juliacomputing/dyad-common";
import { structType, StructType } from "../newtypes/struct.js";
import {
  isVariableInstanceType,
  VariableDeclarationType,
} from "../newtypes/types.js";
import { declarationType } from "./decl.js";
import { applyModifications } from "../modifications/apply.js";
import { resolveQualifiedType } from "./qualified.js";

/**
 * Resolve a structure type.  The context is necessary because **not all
 * `StructTypeDefinition` instances are file-level nodes**.  They can be nested
 * inside of `enum` definitions.
 *
 * @param node
 * @param context
 * @returns
 */
export function resolveStructType(
  node: StructTypeDefinition,
  context: Definition
): Selector<Result<StructType>> {
  return ({ query }) => {
    const problems: Problem[] = [];
    const ret = structType();
    for (const [dn, decl] of Object.entries(node.fields)) {
      query(structDeclarationType(decl, context)).ifResult((t) => {
        ret.fields.set(dn, t);
      }, problems);
    }
    return partialResult(ret, ...problems);
  };
}

/**
 * This resolves the type of individual fields in a `StructTypeDefinition`.
 *
 * @param decl
 * @param context
 * @returns
 */
function structDeclarationType(
  decl: StructFieldDeclaration,
  context: Definition
): Selector<Result<VariableDeclarationType>> {
  return ({ query }) => {
    // First, identify the variable instance type
    const bare = query(
      resolveQualifiedType(
        decl.type,
        context,
        isVariableInstanceType,
        "a variable type"
      )
    );
    // Then wrap it in an array/conditional type expression...as needed
    return bare
      .map((v) => declarationType(v, decl.cond, decl.dims))
      .chain((t) => applyModifications(t, decl.type.mods, context));
  };
}
