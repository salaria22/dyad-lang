// This must import from index.js to avoid a circular dependency
import { Result } from "./index.js";
import { bundledProblems } from "../bundled.js";
import { Problem } from "../problem.js";
import { ResultCases } from "./cases.js";

/**
 * Used to indicate a computation failed with one or more problems of which at
 * least one was fatal
 **/
export class FailedResult<T> extends Result<T> {
  private readonly _problems: [Problem, ...Problem[]];
  constructor(first: Problem, ...rest: Problem[]) {
    super();
    this._problems = [first, ...rest];
  }
  map<R>(_f: (x: T) => R): Result<R> {
    return this as any as FailedResult<R>;
  }
  async mapAsync<R>(_f: (x: any) => Promise<R>): Promise<Result<R>> {
    return this as any as FailedResult<R>;
  }
  chain<R>(_f: (v: any) => Result<R>): Result<R> {
    return this as any as FailedResult<R>;
  }
  async chainAsync<R>(_f: (v: T) => Promise<Result<R>>): Promise<Result<R>> {
    return this as any as FailedResult<R>;
  }
  ifProblems(f: (p: Problem[]) => void): void {
    f(this.problems());
  }
  caseOf<R>(c: ResultCases<any, R>): R {
    return c.errors(this._problems);
  }
  problems(): Problem[] {
    return this._problems;
  }
  unsafeCoerce(): T {
    throw bundledProblems(
      `coerced failure`,
      "Attempted to coerce a failed result",
      [this._problems[0], ...this._problems.slice(1)]
    );
  }
  add(...problems: Problem[]): Result<T> {
    return failedResult(
      this._problems[0],
      ...this._problems.slice(1),
      ...problems
    );
  }
  hasValue(): this is { value: T } {
    return false;
  }
}

/** Create a `FailedResult` instance */
export function failedResult<T = any>(
  first: Problem,
  ...rest: Problem[]
): FailedResult<T> {
  return new FailedResult<T>(first, ...rest);
}
