import { FileLevelNode, Modifications } from "@juliacomputing/dyad-ast";
import {
  assertUnreachable,
  Nullable,
  partialResult,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { DyadDeclarationType } from "../newtypes/types.js";
import { CompilerAssertionError } from "../errors.js";
import { applyModificationToScalarConnectorInstanceType } from "./connectors.js";
import { applyModificationToScalarType } from "./scalar.js";

/**
 * This function applies modifications to any existing type
 *
 * @param t Type to apply modifications to
 * @param mod Modifications to apply
 * @param file `FileLevelNode` where modifications occur
 * @returns Modified type
 */
export function applyModifications<T extends DyadDeclarationType>(
  t: T,
  mod: Nullable<Modifications>,
  file: FileLevelNode
): Result<T> {
  if (mod === null) {
    return successfulResult(t);
  }
  switch (t.resolves) {
    case "Real":
    case "Integer":
    case "Boolean":
    case "String":
    case "Native":
      return applyModificationToScalarType(t, mod, file) as Result<T>;
    case "scon":
      return applyModificationToScalarConnectorInstanceType(
        t,
        mod,
        file
      ) as Result<T>;
    case "analysis":
    case "ccon":
    case "comp":
      /**
       * The reason this just returns is that currently, modifications don't
       * actually change the type of analysis, connectors or components.  This
       * is because we don't formally have anything like `redeclare` in Dyad.
       * We can and should have that but the semantics have yet to be worked out
       * precisely so I'm not adding anything here.  It will probably require
       * some tweaks to AST and or parser before we really have a complete spec.
       * So for now, we do nothing here.
       **/
      return successfulResult(t);
    case "fun":
    case "struct":
    case "enum":
    case "array":
    case "cond":
      throw new CompilerAssertionError(
        "applyModifications",
        `applyModifications should never be called for a ${t.resolves} type`
      );
    default:
      assertUnreachable(t);
  }
  const problems: Problem[] = [];
  return partialResult(t, ...problems);
}
