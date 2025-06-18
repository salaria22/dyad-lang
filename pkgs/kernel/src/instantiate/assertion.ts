import { Assertion } from "@juliacomputing/dyad-ast";
import { RelationInstance } from "./relations.js";
import { InstanceContext } from "./context.js";
import { Result, successfulResult } from "@juliacomputing/dyad-common";

export interface AssertionInstance extends Assertion, InstanceContext {}

export function instantiateAssertion(
  rel: Assertion,
  ictxt: InstanceContext
): Result<AssertionInstance> {
  return successfulResult({
    ...rel,
    ...ictxt,
  });
}

export function isAssertionInstance(
  rel: RelationInstance
): rel is AssertionInstance {
  return rel.kind === "assert";
}
