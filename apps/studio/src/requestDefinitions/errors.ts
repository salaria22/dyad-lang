import { problemError } from "@juliacomputing/dyad-common";

export const noProvider = problemError("no-provider", "No Provider");

export const exceptionThrown = problemError(
  "exception-thrown",
  "Exception thrown"
);
