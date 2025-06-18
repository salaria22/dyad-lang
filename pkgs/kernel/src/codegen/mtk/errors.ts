import { ComponentDefinition, ProblemSpan } from "@juliacomputing/dyad-ast";
import { problemError } from "@juliacomputing/dyad-common";
import { ModelInstance } from "../../instantiate/model.js";
import { problemSpan } from "../../index.js";

const _partialProblem = problemError<ProblemSpan>(
  "partial-problem",
  "Instantiation of partial model"
);

// Trying a new pattern where the we provide a "builder" for
// the underlying problem that is higher level.
export const partialProblem = (
  def: ComponentDefinition,
  instance: ModelInstance
) =>
  _partialProblem(
    instance.name.value,
    `Attempted to instantiate partial model ${instance.name.value}`,
    problemSpan(def, instance.name.span)
  );

export const invalidConnect = problemError<ProblemSpan>(
  "invalid-connect",
  "Invalid connect statement"
);
