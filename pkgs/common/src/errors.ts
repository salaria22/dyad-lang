import { Problem } from "./problem.js";

export class ProblemError<E = unknown> extends Error implements Problem<E> {
  public readonly severity: "error" = "error";
  constructor(
    public readonly instance: string,
    public readonly details: string,
    public readonly type: string,
    public readonly title: string,
    public readonly extra: E
  ) {
    // Pass the title and details to the super class as the "message"
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(`${details}`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProblemError);
    }

    this.name = this.title;
  }
}

export type ErrorConstructor<E> = {
  new (instance: string, details: string, extra: E): ProblemError<E>;
};

export function createError(
  type: string,
  title: string
): ErrorConstructor<void> {
  return class extends ProblemError<void> {
    constructor(instance: string, details: string) {
      super(instance, details, type, title, undefined);
    }
  };
}

export function createExtraError<E>(
  type: string,
  title: string
): ErrorConstructor<E> {
  return class extends ProblemError<E> {
    constructor(instance: string, details: string, extra: E) {
      super(instance, details, type, title, extra);
    }
  };
}
