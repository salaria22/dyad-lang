import { ProblemSpan } from "@juliacomputing/dyad-ast";
import { problemError } from "@juliacomputing/dyad-common";

export const undefinedEntity = problemError<ProblemSpan>(
  "undefined-entity",
  "No such entity"
);

export const invalidEntity = problemError<ProblemSpan>(
  "invalid-entity",
  "Invalid entity"
);

export const invalidTypeName = problemError<ProblemSpan>(
  "invalid-type-name",
  "Invalid type name"
);

export const unknownType = problemError<ProblemSpan>(
  "unknown-type",
  "Unknown type"
);

// Can refer to non file level entities, so no problem span here
export const missingEntity = problemError<void>(
  "missing-entity",
  "Missing entity"
);

export const extendsInExternal = problemError<ProblemSpan>(
  "extends-in-external",
  "Extend in external component"
);

// This doesn't have a problem span because it is used when
// all we have in hand is a definition entity.
export const unknownDefinition = problemError<void>(
  "Unknown definition",
  "Unknown definition"
);

// This doesn't have a problem span because it is used when
// all we have in hand is a definition entity.
export const unknownEntity = problemError<void>(
  "Unknown entity",
  "Unknown entity"
);
