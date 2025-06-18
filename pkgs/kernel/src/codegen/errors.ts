import {
  ProblemInstanceConstructor,
  problemError,
} from "@juliacomputing/dyad-common";

export const NoSuchModule: ProblemInstanceConstructor<void> = problemError(
  "no-such-module",
  "No such module"
);
