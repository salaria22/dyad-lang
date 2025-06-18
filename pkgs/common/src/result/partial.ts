// This must import from index.js to avoid a circular dependency
import { Result } from "./index.js";
import { bundledProblems, toProblems } from "../bundled.js";
import { Problem } from "../problem.js";
import { ResultCases } from "./cases.js";
import { failedResult } from "./failed.js";
import { SuccessfulResult } from "./success.js";

/** Used to indicate a computation succeeded but with at least one problem. */
export class PartialResult<T> extends Result<T> {
  private readonly _problems: Problem[];
  constructor(public readonly value: T, first: Problem, ...rest: Problem[]) {
    super();
    this._problems = [first, ...rest];
  }
  map<R>(f: (x: T) => R): Result<R> {
    return Result.catch(() => f(this.value)).add(...this._problems);
  }
  async mapAsync<R>(f: (x: T) => Promise<R>): Promise<Result<R>> {
    return (await Result.catchAsync(() => f(this.value))).add(
      ...this._problems
    );
  }
  chain<R>(f: (v: T) => Result<R>): Result<R> {
    try {
      const ret = f(this.value);
      const aug = ret.add(...this._problems);
      return aug;
    } catch (e) {
      return failedResult(...toProblems(e), ...this._problems);
    }
  }
  async chainAsync<R>(f: (v: T) => Promise<Result<R>>): Promise<Result<R>> {
    try {
      const ret = await f(this.value);
      const aug = ret.add(...this._problems);
      return aug;
    } catch (e) {
      return failedResult(...toProblems(e), ...this._problems);
    }
  }

  caseOf<R>(c: ResultCases<T, R>): R {
    return c.warnings(this.value, this._problems);
  }
  problems(): Problem[] {
    return this._problems;
  }
  unsafeCoerce(conservative?: boolean): T {
    if (conservative) {
      throw bundledProblems(
        `coerced failure`,
        "Attempted to conservatively coerce a partial result",
        [this._problems[0], ...this._problems.slice(1)]
      );
    } else {
      return this.value;
    }
  }
  add(...problems: Problem[]): Result<T> {
    return partialResult(this.value, ...this._problems, ...problems);
  }
  hasValue(): this is { value: T } {
    return true;
  }
}

/**
 * Create a `PartialResult` instance or a `SuccessfulResult` if the set of
 * problems is empty.
 **/
export function partialResult<T>(
  value: T,
  ...problems: Problem[]
): PartialResult<T> | SuccessfulResult<T> {
  if (problems.length === 0) {
    return new SuccessfulResult(value);
  } else {
    const first = problems[0];
    const rest = problems.slice(1);
    return new PartialResult(value, first, ...rest);
  }
}
