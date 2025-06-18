import { Just } from "purify-ts/Maybe";
import {
  assertUnreachable,
  FailedResult,
  failedResult,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  analysisType,
  componentType,
  enumType,
  functionType,
  structConnectorType,
  structType,
  ResolvedType,
  scalarConnectorType,
} from "./types.js";
import { Definition, qualifiedName } from "@juliacomputing/dyad-ast";

import { NonScalarTypeError } from "../errors.js";
import {
  InflightLookups,
  QueryHandler,
  resolvedScalar,
  resolveType,
} from "../index.js";
import { contextualizeProblem, problemSpan } from "../utils.js";

/**
 * Take the provided definition and compute its `ResolutionState` from it.
 * Ideally, we want to get a `ResolutionSucceeded` object out of this with a
 * `ResolvedType` nested inside.  But the `ResolvedState` tagged union provides
 * other necessary contingencies as well.
 *
 * @param def The definition to resolve
 * @param workspace The workspace
 * @returns
 */
export function resolveDefinition(
  def: Definition,
  query: QueryHandler,
  inflight: InflightLookups
): Result<ResolvedType> {
  switch (def.kind) {
    // The first few are trivial for now although I suspect we may have to do
    // additional semantic processing later one which is why I keep each one
    // separate.  They will probably end up looking like the "scalar" case
    // eventually.
    case "cdef": {
      return successfulResult(componentType(def));
    }
    case "strcon": {
      return successfulResult(structConnectorType(def));
    }
    case "sclcon": {
      return successfulResult(scalarConnectorType(def));
    }
    case "enum": {
      return successfulResult(enumType(def));
    }
    case "struct": {
      return successfulResult(structType(def));
    }
    case "adef": {
      return successfulResult(analysisType(def));
    }
    case "fun": {
      const problems: Problem<unknown>[] = [];
      const result = functionType(def, [], {}, []);
      for (const t of def.positional) {
        query(resolveType(t.name, def, inflight)).ifResult(
          (r) => result.positional.push(r),
          problems
        );
      }
      const kentries = Object.entries(def.keyword);
      for (const entry of kentries) {
        query(resolveType(entry[1].name, def, inflight)).ifResult(
          (r) => (result.keyword[entry[0]] = r),
          problems
        );
      }
      for (const t of def.returns) {
        query(resolveType(t.name, def, inflight)).ifResult(
          (r) => result.returns.push(r),
          problems
        );
      }
      if (problems.length > 0) {
        return failedResult(problems[0], ...problems.slice(1));
      }
      return successfulResult(result);
    }
    case "scalar": {
      // Ask the workspace to resolve the type of the base type
      // used in this scalar type definition
      const baseType = query(resolveType(def.base.name, def, inflight));
      if (baseType instanceof FailedResult) {
        return baseType;
      }
      if (baseType.hasValue() && baseType.value.resolves === "scalar") {
        const parent = baseType.value;
        const ret = resolvedScalar(parent.base, Just(def), def.source, {
          ...parent.mods,
          ...def.base.mods,
        });
        return successfulResult(ret);
      }

      return failedResult(
        contextualizeProblem(
          def,
          new NonScalarTypeError(
            qualifiedName(def.base),
            `Type '${qualifiedName(
              def.base
            )} has a parent that is not a scalar type`,
            problemSpan(def, def.base.span)
          )
        )
      );
    }
    /* istanbul ignore next */
    default: {
      assertUnreachable(def);
    }
  }
}
