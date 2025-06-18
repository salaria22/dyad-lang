import { toProblems } from "../bundled.js";
import { isProblem, Problem } from "../problem.js";
import { ResultCases } from "./cases.js";
import { failedResult, partialResult, successfulResult } from "./index.js";

export type ResultOf<T extends Result<any>> =
  T extends Result<infer U> ? U : never;

export abstract class Result<T> {
  /**
   * This function turns an array of `Result`s into a `Result`
   * that contains an array.  This is analogous to `Promise.all`.
   *
   * @param x The array of `Result`s
   * @returns A `Result` containing an array value
   */
  static all<T>(x: Array<Result<T>>): Result<Array<T>> {
    /** Handle the sneaky case where there are no results in the array. */
    if (x.length === 0) {
      return successfulResult([]);
    }
    /** This will contain the values of the successful results */
    const values: T[] = [];
    /** This will accumulate all problems */
    const problems: Problem[] = [];

    /** Loop over all results */
    for (const item of x) {
      item.caseOf({
        // If it was an error, accumulate problems
        errors: (e) => {
          problems.push(...e);
        },
        // If it was a warning, note the problems and the value
        warnings: (v, w) => {
          values.push(v);
          problems.push(...w);
        },
        // If it was successful, note the value
        success: (v) => {
          values.push(v);
        },
      });
    }
    /**
     * If the number of values matches the size of the original
     * array, then all results were successful and, therefore, the
     * overall result was a success.
     */
    if (values.length === x.length) {
      return partialResult(values, ...problems);
    } else {
      if (problems.length === 0) {
        /* istanbul ignore next */
        throw new Error(
          "Missing values but not problems, this should not happen"
        );
      }
      // Otherwise, report as a failure along with all problems.
      return failedResult(problems[0], ...problems.slice(1));
    }
  }

  /**
   * This function takes a record of results and transforms it into
   * a result of a record (assuming values are available for all
   * keys).
   *
   * @param obj The object containing a record of results
   * @returns
   */
  static combine<T extends Record<string, Result<any>>>(
    obj: T
  ): Result<{ [K in keyof T]: ResultOf<T[K]> }> {
    const problems: Problem[] = [];
    const ret: Record<string, Result<any>> = {};
    let failed = false;
    if (Object.entries(obj).length === 0) {
      return successfulResult(ret as { [K in keyof T]: ResultOf<T[K]> });
    }

    for (const [key, val] of Object.entries(obj)) {
      val.caseOf({
        // Accumulate problems
        errors: (e) => {
          problems.push(...e);
          failed = true;
        },
        // If it was a warning, note the problems and the value
        warnings: (v, w) => {
          problems.push(...w);
          ret[key] = v;
        },
        // If it was successful, note the value
        success: (v) => (ret[key] = v),
      });
    }

    if (failed) {
      if (problems.length === 0) {
        /* istanbul ignore next */
        throw new Error(
          "Missing problems for failed result, this should not happen"
        );
      }
      return failedResult(problems[0], ...problems.slice(1));
    }

    return partialResult(
      ret as { [K in keyof T]: ResultOf<T[K]> },
      ...problems
    );
  }

  /**
   * This function is used to wrap arbitrary code that may throw exceptions and to
   * then collect those exceptions and add them to any existing problems.
   *
   * @param problems
   * @param f
   */
  static catchProblems(problems: Problem[], f: () => void): void {
    try {
      return f();
    } catch (e) {
      problems.push(...toProblems(e));
    }
  }

  /**
   * This function wraps a closure that nominally returns a `T` and
   * catches any exceptions thrown by it and translates that into a
   * `FailedResult`.
   *
   * @param f function to invoke
   */
  static catch<T>(f: () => T): Result<T> {
    try {
      return successfulResult(f());
    } catch (e: any) {
      return failedResult(...toProblems(e));
    }
  }

  /**
   * This function wraps a closure that nominally returns a `Promise<T>` and
   * catches any rejections and translates that into a `FailedResult`.
   *
   * @param f function to invoke
   * @returns
   */
  static async catchAsync<T>(f: () => Promise<T>): Promise<Result<T>> {
    try {
      return successfulResult(await f());
    } catch (e: any) {
      return failedResult(...toProblems(e));
    }
  }

  /**
   * Maps the successful result, if there is one.  Note, this function *also*
   * catches any throw exceptions and translates that into a `FailedResult`.
   * Also, any exceptions thrown inside `mapResult` are captured just as
   * with `catchResult`.
   */
  abstract map<R>(f: (x: T) => R): Result<R>;

  /**
   * This function is like `map` in that it takes an existing `Result<T>`
   * and performs a map operation on it.  But this function is used to handle the
   * case where the closure returns a `Result` that contains a `Promise`.  This
   * function inverts that into a `Promise` of a `Result` which is generally what
   * you ultimately want.
   *
   * As with `map`, if the closure returns a rejected promise, that error
   * along with any problems identified with the original `Result` r will be
   * aggregated together into a `FailedResult`.
   */
  abstract mapAsync<R>(f: (x: T) => Promise<R>): Promise<Result<R>>;

  /** Chains one result into another */
  abstract chain<R>(f: (v: T) => Result<R>): Result<R>;

  /** Chains a promise of a result into another promise of a result */
  abstract chainAsync<R>(f: (v: T) => Promise<Result<R>>): Promise<Result<R>>;

  /**
   * Do something if the result is either successful or partially successful.
   * Unlike a map or chain operation which aggregates any existing problems into
   * the next Result, there is no next Result here.  As such, you must provide an
   * array of problems and any problems associated with this result will be pushed
   * into that array so they are not lost.
   */
  ifResult(f: (v: T) => void, problems: Problem[]): void {
    problems.push(...this.problems());
    this.map(f);
  }

  /**
   * Does the same thing as `ifResult` but for a function that is asynchronous
   * @param problems - Will push any problems into the provided problem array
   * @param f - The code to run if a value is present
   */
  async ifAsyncResult<R>(
    f: (v: T) => Promise<R>,
    problems: Problem[]
  ): Promise<void> {
    await this.mapAsync(f);
    problems.push(...this.problems());
  }

  /** This action is used if you need to act on problems associated with a result */
  ifProblems(f: (p: Problem[]) => void): void {
    const problems = this.problems();
    if (problems.length > 0) {
      f(problems);
    }
  }

  /** Handle all possible cases of a result */
  abstract caseOf<R>(c: ResultCases<T, R>): R;

  /** Extract all problems associated with a result */
  abstract problems(): Problem[];

  /**
   * This method returns the contained value, if one exists.  Otherwise,
   * it returns the default value.
   *
   * @param def
   * @returns The contained value or the provided default
   */
  orDefault(def: T): T {
    return this.hasValue() ? this.value : def;
  }

  /**
   * This method returns the result of calling `f` on the contained value _if
   * one exists_.  Otherwise, it simple returns the `def` argument value.
   * @param f
   * @param def
   * @returns Returns the result of applying `f` to the contained value or `def`
   */
  mapOrDefault<R>(f: (x: T) => R, def: R): R {
    return this.map(f).orDefault(def);
  }

  /**
   * This method allows the user to provide an alternative `Result` to
   * use if this result doesn't provide a value.
   *
   * @param r Alternative `Result` to use
   * @returns The current result if it has a value, otherwise the alternative
   */
  alt(r: Result<T>): Result<T> {
    return this.hasValue() ? this : r;
  }

  /**
   * This function unwraps a result and throws if it was not a successful result.
   * In other words, this function is very conservative.  In order to avoid
   * lossing any errors associated with a partial result, **it treats a partial
   * result just like a failed result**.
   *
   * Any problems associated with the result are thrown as a bundled problem so
   * they can be caught and reconstituted by any enclosing `mapResult` or
   * `chainResult` invocations.
   *
   * @param conservative Whether to throw if any problems are present (default: true)
   * @returns The value of the result, if there is one.
   */
  abstract unsafeCoerce(conservative?: boolean): T;

  /**
   * Returns true if any of the contained problems is of type `problemType`
   * @param problemType The problem type we are looking for
   */
  includes(problemType: string): boolean {
    const problems = this.problems();
    return problems.some((p) => p.type === problemType);
  }

  /**
   * This method adds additional problems to an existing `Result`
   * @param problems problems to add
   */
  abstract add(...problems: Problem[]): Result<T>;

  /**
   * Peek into result to see if it has a value.
   */
  abstract hasValue(): this is { value: T };

  /**
   * The filter method can be used when we expect a specific kind
   * of value in the result.  If we don't find the expected value
   * (as indicated by the predicate), we transform the result into
   * a failed result with the associated problem.
   *
   * @param pred
   * @param or
   */
  filter<U extends T>(
    pred: (value: T) => value is U,
    or: Problem | ((v: T) => Problem)
  ): Result<U>;
  filter(
    pred: (value: T) => boolean,
    or: Problem | ((v: T) => Problem)
  ): Result<T>;
  filter(
    pred: (value: T) => boolean,
    or: Problem | ((v: T) => Problem)
  ): Result<T> {
    return this.caseOf({
      errors: (errors) => failedResult(...errors),
      warnings: (v, warnings) => {
        if (pred(v)) {
          return partialResult(v, ...warnings);
        } else {
          return failedResult(isProblem(or) ? or : or(v));
        }
      },
      success: (v) => {
        if (pred(v)) {
          return successfulResult(v);
        } else {
          return failedResult(isProblem(or) ? or : or(v));
        }
      },
    });
  }

  /**
   * This function returns true if the value contained in each `Result` is
   * identical.
   *
   * @param other
   * @returns
   */
  equals<R extends T>(other: Result<R>): boolean {
    return this.hasValue() && other.hasValue() && this.value === other.value;
  }

  /** Indicates of this result has problems */
  hasProblems(): boolean {
    return this.problems().length > 0;
  }

  /**
   * This method replaces any existing errors with one or more alternative
   * errors.  This is useful if the details of the original errors are not
   * important or should not be propagated.  Instead, they can be replaced by a
   * more generic message or summary.
   *
   * @param first The mandatory first problems
   * @param rest Any additional problems
   * @returns The same result value but with different problems (if any)
   */
  replaceProblems(first: Problem, ...rest: Problem[]) {
    return this.caseOf({
      errors: (): Result<T> => failedResult(first, ...rest),
      warnings: (v): Result<T> => partialResult(v, first, ...rest),
      success: () => this,
    });
  }

  /**
   * Check if two results have the same value.  Note, this does **not**
   * compare any associated problems, just the values themselves (which
   * is why this isn't called `equals`).
   */
  sameValue(r: Result<T>): boolean {
    return this.hasValue() && r.hasValue() ? r.value === this.value : false;
  }
}
