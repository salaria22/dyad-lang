import { Nullable } from "@juliacomputing/dyad-common";
import { ResolvedType } from "../workspace/index.js";
import { DocString, Expression } from "@juliacomputing/dyad-ast";

/**
 * This is used to represent constant instances.  These are instances that are
 * global in scope (as least for now, we could potentially allow declaring these
 * inside components, etc...but I don't see why we'd need that)
 *
 * Examples: `time` and `π`
 */
export interface ConstantInstance {
  kind: "con";
  name: string;
  type: ResolvedType;
  doc_string: Nullable<DocString>;
  value: Nullable<Expression>;
}

export function constantInstance(
  name: string,
  type: ResolvedType,
  doc_string: Nullable<DocString>,
  value: Nullable<Expression>
): ConstantInstance {
  return {
    kind: "con",
    name,
    type,
    doc_string,
    value,
  };
}
