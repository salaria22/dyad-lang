import { isObject } from "./object.js";

export interface Problem<E = unknown> {
  severity: "info" | "warning" | "error";
  /**
   * This is an id for the class of problem involved.  This field and those
   * that follow were heavily inspired by RFC 7807.
   */
  type: string;
  /**
   * This is a human readable description of the class of problem involved
   */
  title: string;
  /**
   * This is an id for the specific problem instance
   */
  instance: string;
  /**
   * This is a human readable description of the specific instance
   */
  details: string;
  /**
   * Any additional information the problem might have.
   */
  extra: E;
}

export function sameProblem(a: Problem, b: Problem): boolean {
  // Technically, I should only have to check type and instance, but I want to be sure...
  return (
    a.type === b.type &&
    a.title === b.title &&
    a.instance === b.instance &&
    a.details === b.details
  );
}

export function uniqueProblems<T>(
  problems: Array<Problem<T>>
): Array<Problem<T>> {
  const ret: Array<Problem<T>> = [];
  for (const p of problems) {
    if (ret.some((cur) => sameProblem(cur, p))) {
      continue;
    }
    ret.push(p);
  }
  return ret;
}

export function problemMessage(e: Problem): string {
  if (e.extra) {
    const extra = Object.entries(e.extra)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    if (extra === "") {
      return `${e.title}: ${e.details}`;
    }
    return `${e.title}: ${e.details} [${extra}]`;
  }
  return `${e.title}: ${e.details}`;
}

export function isProblem(obj: any): obj is Problem {
  if (isObject(obj)) {
    const { severity, type, title, instance, details } = obj;
    return (
      (severity === "info" || severity === "warning" || severity === "error") &&
      typeof type === "string" &&
      typeof title === "string" &&
      typeof instance === "string" &&
      typeof details === "string"
    );
  }
  return false;
}

export function isProblemWith<T>(
  obj: any,
  pred: (x: any) => x is T
): obj is Problem<T> {
  return isProblem(obj) && pred(obj.extra);
}

export function problemError<E = void>(
  type: string,
  title: string
): ProblemInstanceConstructor<E> {
  return problemType<E>(type, title, "error");
}

export function problemWarning<E = void>(
  type: string,
  title: string
): ProblemInstanceConstructor<E> {
  return problemType<E>(type, title, "warning");
}

export function problemInfo<E = void>(
  type: string,
  title: string
): ProblemInstanceConstructor<E> {
  return problemType<E>(type, title, "info");
}

export type ProblemInstanceConstructor<E> = (
  instance: string,
  details: string,
  extra: E
) => Problem<E>;

function problemType<E = void>(
  type: string,
  title: string,
  severity: "error" | "warning" | "info"
): ProblemInstanceConstructor<E> {
  return (instance: string, details: string, extra: E): Problem<E> => {
    return {
      severity: severity,
      type,
      title,
      details,
      instance,
      extra,
    };
  };
}
