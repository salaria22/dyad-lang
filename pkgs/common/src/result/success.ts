// This must import from index.js to avoid a circular dependency
import { Result } from "./index.js";
import { Problem } from "../problem.js";
import { ResultCases } from "./cases.js";
import { failedResult } from "./failed.js";
import { partialResult } from "./partial.js";
import { toProblems } from "../bundled.js";

/**
 * Used to represent an outcome where there were no problems.
 */
export class SuccessfulResult<T> extends Result<T> {
  constructor(public value: T) {
    super();
  }
  map<R>(f: (x: T) => R): Result<R> {
    return Result.catch(() => f(this.value));
  }
  async mapAsync<R>(f: (x: T) => Promise<R>): Promise<Result<R>> {
    return await Result.catchAsync(() => f(this.value));
  }
  chain<R>(f: (x: T) => Result<R>) {
    try {
      return f(this.value);
    } catch (e) {
      return failedResult(...toProblems(e));
    }
  }
  async chainAsync<R>(f: (v: T) => Promise<Result<R>>): Promise<Result<R>> {
    try {
      return await f(this.value);
    } catch (e: any) {
      return failedResult(...toProblems(e));
    }
  }

  caseOf<R>(c: ResultCases<T, R>): R {
    return c.success(this.value);
  }
  /** Extract all problems associated with a result */
  problems(): Problem[] {
    return [];
  }
  unsafeCoerce(): T {
    return this.value;
  }
  add(...problems: Problem[]): Result<T> {
    if (problems.length === 0) {
      return this;
    }
    return partialResult(this.value, ...problems);
  }
  hasValue(): this is { value: T } {
    return true;
  }
}

/** Create a `SuccessfulResult` instance */
export function successfulResult<T>(v: T): SuccessfulResult<T> {
  return new SuccessfulResult(v);
}
