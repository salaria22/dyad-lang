import { Either } from "purify-ts/Either";
import {
  Problem,
  Result,
  failedResult,
  partialResult,
  successfulResult,
  toProblems,
} from "@juliacomputing/dyad-common";
import { MaybePatterns } from "purify-ts";

/** Convert an Either<Problem,T> into a Result<T> */
export function eitherToResult<T>(e: Either<any, T>): Result<T> {
  return e.caseOf<Result<T>>({
    Left: (e) => failedResult(...toProblems(e)),
    Right: (v) => successfulResult(v),
  });
}

/**
 * This function behaves very much like `ifResult` but it specifically
 * handles the case of an `Either` rather than a `Result`.
 * @param r The `Either` to be processed
 * @param problems The set of problems to add a `Left` result to
 * @param f The function to call with the `Right` result
 * @returns void
 */
export function ifEither<T>(
  r: Either<Problem, T>,
  problems: Problem[],
  f: (v: T) => void
): void {
  return r.caseOf<void>({
    Left: (p) => problems.push(p),
    Right: (v) => f(v),
  });
}

/**
 * This function provides the "cases" needed by `Maybe.caseOf` to process a
 * `Nothing` result into a `Result` using the provided `problem` as the problem
 * to report in case no value is present.
 *
 * @param problem Problem to use in case of `Nothing`
 * @returns `Result<T>` from a `Maybe<T>`
 */
export function nothingProblem<T>(
  problem: Problem
): MaybePatterns<T, Result<T>> {
  return {
    Nothing: () => failedResult(problem),
    Just: (v) => successfulResult(v),
  };
}

/**
 * Combine a map whose values are Results into a Result containing a map
 *
 * @param map
 * @returns
 */
export function combineResultMap<K, V>(
  map: Map<K, Result<V>>
): Result<Map<K, V>> {
  const problems: Problem[] = [];
  const result = new Map<K, V>();
  for (const [k, v] of map) {
    v.ifResult((v) => result.set(k, v), problems);
  }
  return partialResult(result, ...problems);
}
