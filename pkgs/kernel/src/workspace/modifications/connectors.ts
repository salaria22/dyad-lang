import { Modifications, FileLevelNode } from "@juliacomputing/dyad-ast";
import { Result } from "@juliacomputing/dyad-common";
import { ScalarConnectorInstanceType } from "../newtypes/connectors.js";
import { applyModificationToScalarType } from "./scalar.js";
import { isScalarType } from "../newtypes/scalar.js";
import { UnimplementedError } from "../errors.js";

/**
 * This function applies a set of modifications to a scalar
 * connector instance type (which may delegate some of the
 * modification processing to `applyModificationToScalarType`)
 */
export function applyModificationToScalarConnectorInstanceType(
  t: ScalarConnectorInstanceType,
  mod: Modifications,
  file: FileLevelNode
): Result<ScalarConnectorInstanceType> {
  if (isScalarType(t.type)) {
    return applyModificationToScalarType(t.type, mod, file).map((mtype) => ({
      ...t,
      type: mtype,
    }));
  }
  throw new UnimplementedError(
    "applyModificationToScalarConnectorInstanceType",
    "applyModificationToScalarConnectorInstanceType is not implemented for non-scalar types"
  );
}
