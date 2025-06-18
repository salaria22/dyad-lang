import { Equation } from "@juliacomputing/dyad-ast";
import type { RelationInstance } from "./relations.js";
import { InstanceContext } from "./context.js";

export interface EquationInstance extends Equation, InstanceContext {}

export function equationInstance(
  eq: Equation,
  ictxt: InstanceContext
): EquationInstance {
  return {
    ...eq,
    ...ictxt,
  };
}

export function isEquationInstance(
  rel: RelationInstance
): rel is EquationInstance {
  return rel.kind === "eq";
}
