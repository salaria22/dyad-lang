import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import {
  FileKey,
  isProblemSpan,
  isTextProblem,
  ProblemSpan,
  TextProblem,
  TextualSpan,
  Modifications,
  FileContents,
  FileLevelNode,
  hasExpression,
} from "@juliacomputing/dyad-ast";
import { Nullable, Problem } from "@juliacomputing/dyad-common";
import { compilerAssertionType, unimplementedType } from "./errors.js";
import { toJS } from "mobx";

/**
 * Take a given filename and normalize it so it always starts with
 * a ./ (this is the convention for the `StandardLibraryProvider`)
 * @param s
 */
export function normalizePath(s: string): string {
  if (s.startsWith("/")) {
    return "." + s;
  }
  if (s.startsWith("./")) {
    return s;
  }
  return "./" + s;
}

/** Local helper function to try and determine the content type based on a file name */
export function guessContentType(filename: string, _: ArrayBuffer) {
  if (filename.toLowerCase().endsWith(".svg")) {
    return "image/svg";
  }
  if (filename.toLowerCase().endsWith(".png")) {
    return "image/png";
  }
  return "application/octet-stream";
}

export function stringifyLocation(
  fileKey: Nullable<FileKey>,
  span: TextualSpan
): string {
  if (fileKey) {
    return `${fileKey.file}:${span.sl}:${span.sc}`;
  } else {
    return `${span.sl}:${span.sc}`;
  }
}

export function stringifyProblem(p: Problem<unknown>): string {
  const extra = p.extra;
  if (extra && isProblemSpan(extra) && extra.file && extra.span) {
    return `${stringifyLocation(extra.file, extra.span)} - ${p.type}: ${
      p.details
    }`;
  }
  if (p.type === compilerAssertionType || p.type === unimplementedType) {
    return `${p.type} in ${p.instance}(...) - ${p.details}`;
  }
  return `${p.type} - ${p.details}`;
}

export type MaybeRecord<T> = {
  [P in keyof T]: Maybe<T[P]>;
};

export function chainRecord<T>(maybes: MaybeRecord<T>): Maybe<T> {
  const ret: Record<string | number | symbol, unknown> = {};
  for (const [key, val] of Object.entries(maybes)) {
    const m = val as Maybe<unknown>;
    if (m.isNothing()) {
      return Nothing;
    }
    ret[key] = m.unsafeCoerce();
  }
  return Just(ret) as any as Maybe<T>;
}

export type MaybeOf<T> = T extends Maybe<infer R> ? R : never;

export function combineMaybe<T extends Record<string, Maybe<any>>>(
  obj: T
): Maybe<{ [K in keyof T]: MaybeOf<T[K]> }> {
  const ret: Record<string, Maybe<any>> = {};
  let failed = false;
  if (Object.entries(obj).length === 0) {
    return Just(ret as any);
  }

  for (const [key, val] of Object.entries(obj)) {
    val.caseOf({
      Just: (v) => {
        ret[key] = v;
      },
      Nothing: () => {
        failed = true;
      },
    });
  }

  if (failed) {
    return Nothing;
  }

  return Just(ret as any);
}

/**
 * Covenient function to build a problem span from a file level node and the
 * span of some element presumably contained within it.
 */
export function problemSpan(
  node: FileLevelNode,
  span: Nullable<TextualSpan>
): ProblemSpan {
  return {
    file: node.source,
    span,
  };
}

export function spanInFile(
  x: FileContents,
  span: Nullable<TextualSpan>
): ProblemSpan {
  const filekey = x.source;
  const ret: ProblemSpan = {
    file: filekey,
    span: span,
  };
  return ret;
}

export function contextualizeProblem(
  context: FileLevelNode,
  p: Problem<unknown>
): TextProblem {
  if (isTextProblem(p)) {
    return p;
  }
  const extra = problemSpan(context, null);
  const ret: TextProblem = {
    ...p,
    extra,
  };
  return ret;
}

export function extractUnits(mods: Modifications): string {
  const units = mods["units"];
  if (
    units !== undefined &&
    hasExpression(units) &&
    units.expr.type === "slit"
  ) {
    return units.expr.value;
  }
  return "--";
}

export function extractGuess(mods: Modifications): Maybe<number> {
  const guess = mods["guess"];
  if (guess === undefined || !hasExpression(guess)) {
    return Nothing;
  }
  switch (guess.expr.type) {
    case "ilit":
    case "rlit":
      return Just(guess.expr.value);
    default:
      return Nothing;
  }
}

export function compareMaybe<T>(
  a: Maybe<T>,
  b: Maybe<T>,
  comp?: (a: T, b: T) => boolean
): boolean {
  return a
    .map((av) =>
      b.map((bv) => (comp ? comp(av, bv) : av === bv)).orDefault(false)
    )
    .orDefault(false);
}

export function mobxClone<T>(x: T): T {
  try {
    return structuredClone(toJS(x));
  } catch (e: any) {
    const js = JSON.stringify(x);
    const obj = JSON.parse(js);
    return obj;
  }
}

// export function memoize<T extends object, R>(
//   f: (x: T) => R,
//   cache: WeakMap<T, R>
// ) {
//   return (x: T) => {
//     const v = cache.get(x);
//     if (v !== undefined) {
//       return v;
//     }
//     const c = f(x);
//     cache.set(x, c);
//     return c;
//   };
// }
