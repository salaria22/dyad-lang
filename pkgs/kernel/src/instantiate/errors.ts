import { ProblemSpan } from "@juliacomputing/dyad-ast";
import { createError, problemError } from "@juliacomputing/dyad-common";

export const UnknownTypeError = createError("UnknownTypeError", "Unknown Type");
export const unknownTypeProblem = problemError<ProblemSpan>(
  "UnknownTypeProblem",
  "Unknown Type"
);

export const illegalExtendType = problemError<ProblemSpan>(
  "ExtendNonModel",
  "Extending from non-model"
);

export const UnexpectedTypeError = problemError<ProblemSpan>(
  "unexpected-type",
  "Unexpected type"
);

// This doesn't include a problem span because it reports the
// stack of types, but can't really localize the issue.
export const infiniteRecursion = problemError<void>(
  "InfiniteRecursion",
  "Infinite recursion"
);

export const existingElement = problemError<ProblemSpan>(
  "ExistingElement",
  "Existing element"
);

export const unknownElement = problemError<ProblemSpan>(
  "unknown-element",
  "Unknown element"
);

export const unexpectedImplementation = problemError<ProblemSpan>(
  "unexpected-implementation",
  "Unexpected implementation"
);

export const UnrecognizedAnalysis = problemError<ProblemSpan>(
  "unrecognized-analysis",
  "Unrecognized analysis"
);

export const unexpectedValue = problemError<ProblemSpan>(
  "unexpected-value",
  "Unexpected value"
);

export const missingValue = problemError<ProblemSpan>(
  "missing-value",
  "Missing value"
);

export const unexpectedDeclarations = problemError<ProblemSpan>(
  "unexpected-declarations",
  "Unexpected declarations"
);

export const malformedConnectorReference = problemError<ProblemSpan>(
  "malformed-connector-ref",
  "Malformed connector reference"
);

export const incompatibleConnectorTypes = problemError<ProblemSpan>(
  "incompatible-connector-types",
  "Incompatible connector types"
);

export const invalidConnection = problemError<ProblemSpan>(
  "invalid-connection",
  "Invalid connection"
);

export const invalidContinuitySet = problemError<ProblemSpan>(
  "invalid-common-set",
  "Invalid common set"
);

export const invalidDataset = problemError<ProblemSpan>(
  "invalid-dataset",
  "Invalid type for optimization data"
);

export const finalNoInit = problemError<ProblemSpan>(
  "missing-initialization",
  "Missing initialization"
);

export const undeclaredSymbol = problemError<ProblemSpan>(
  "undeclared-symbol",
  "Undeclared symbol"
);

export const invalidIndex = problemError<ProblemSpan>(
  "invalid-index",
  "Invalid index"
);

export const invalidField = problemError<ProblemSpan>(
  "invalid-field",
  "Invalid field"
);

export const existingAnalysisPoint = problemError<ProblemSpan>(
  "existing-analysis-point",
  "Existing analysis point"
);

export const invalidAnalysisPoint = problemError<ProblemSpan>(
  "invalid-analysis-point",
  "Invalid analysis point"
);
