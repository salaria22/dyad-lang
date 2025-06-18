import { ProblemSpan } from "@juliacomputing/dyad-ast";
import { problemError } from "@juliacomputing/dyad-common";

export const missingSchema = problemError<ProblemSpan>(
  "missing-schema",
  "Missing schema"
);

export const invalidSchema = problemError<ProblemSpan>(
  "invalid-schema",
  "Invalid schema"
);

export const unsupportedSchemaType = problemError<ProblemSpan>(
  "unsupported-schema-type",
  "Unsupported schema type"
);

export const invalidConnectionSet = problemError<ProblemSpan>(
  "invalid-connection-set",
  "Invalid connection set"
);

export const unknownConnector = problemError<ProblemSpan>(
  "unknown-connector",
  "Unknown connector"
);
