import {
  isProblem,
  Problem,
  problemError,
  ProblemInstanceConstructor,
} from "./problem.js";

/**
 * This problem is used to represent nested problems.  It is used when an
 * exception needs to be thrown, but we want to preserve some existing set of
 * problems.
 */
const bundledProblemType = "bundled-problems";
export const bundledProblems: ProblemInstanceConstructor<
  [Problem, ...Problem[]]
> = problemError(bundledProblemType, "Bundled problems");

export function isBundled(e: Problem): e is Problem<[Problem, ...Problem[]]> {
  return e.title === bundledProblemType;
}

/**
 * This is used when we expect a `Problem` but get just an `Error`
 */
export const expectedProblem: ProblemInstanceConstructor<unknown> =
  problemError("expected-problem", "Expected a Problem");

/**
 * Takes a given object an transforms it into an array of problems.
 * @param e
 * @returns
 */
export function toProblems(e: any): [Problem, ...Problem[]] {
  if (isProblem(e)) {
    if (isBundled(e)) {
      return e.extra;
    }
    return [e];
  }
  return [
    expectedProblem(
      e.type,
      `Expected a problem but caught a plain error: ${e.message}: ${e.stack}`,
      e
    ),
  ];
}
