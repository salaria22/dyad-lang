import { DocString, FunctionTypeDefinition } from "@juliacomputing/dyad-ast";
import { ResolvedFunctionType } from "../workspace/index.js";
import { Nullable } from "@juliacomputing/dyad-common";

export interface FunctionTypeInstance {
  kind: FunctionTypeDefinition["kind"];
  /** The ResolvedScalarType */
  type: ResolvedFunctionType;
  doc_string: Nullable<DocString>;
}

export function instantiateFunctionType(
  t: ResolvedFunctionType
): FunctionTypeInstance {
  return {
    kind: "fun",
    type: t,
    doc_string: null,
  };
}
