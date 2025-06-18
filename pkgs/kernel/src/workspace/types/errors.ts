import { ProblemSpan, spanError, TextProblem } from "@juliacomputing/dyad-ast";
import { ProblemInstanceConstructor } from "@juliacomputing/dyad-common";

export const invalidOperator: ProblemInstanceConstructor<ProblemSpan> =
  spanError("invalid-operator", "Invalid operator");

export const booleanRequired: ProblemInstanceConstructor<ProblemSpan> =
  spanError("boolean-required", "Boolean value required");

export const incompatibleTypes: ProblemInstanceConstructor<ProblemSpan> =
  spanError("incompatible-types", "Incompatible types");

/**
 * This is slightly faster than subclassing an `Error`.  So if you don't
 * actually need an `Error` type to throw, this is faster (no stack capturing,
 * no `message` field, _etc._).  Need a helper function to make this easier to
 * define though.
 **/
export const lookupFailed = (
  instance: string,
  details: string,
  extra: ProblemSpan
): TextProblem => {
  return {
    type: "lookup-failed",
    title: "Lookup failed",
    severity: "error",
    instance,
    details,
    extra,
  };
};
