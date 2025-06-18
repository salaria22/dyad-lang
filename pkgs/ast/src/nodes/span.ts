import {
  Nullable,
  Problem,
  ProblemInstanceConstructor,
  isObject,
  isProblemWith,
  problemError,
  problemInfo,
  problemWarning,
} from "@juliacomputing/dyad-common";
import { FileKey, isFileKey } from "./keys";

/**
 * This is information about where, within a file a particular entity exists.
 * The file itself isn't included here but it is stored higher up in the tree in
 * the enclosing FileContents node.
 *
 * The quantities referenced here are all index-1.  What that means is that
 * `startLine` of 1 means the first line of text and `startColumn` means the
 * first column of a line.
 *
 * The names have been abbreviated because this data appears repeatedly in the
 * AST and if it is serialized into JSON, long names will make the overall
 * uncompressed size of such serialized data unnecessarily large.
 *
 * @category Structured Data
 **/
export interface TextualSpan {
  /** This is the `startLine` (the line, index 1, where this textual span begins) */
  sl: number;
  /** This is the `startColumn` (the column, index 1, where this textual span begins) */
  sc: number;
  /** This is the `endLine` (the line, index 1, where this textual span ends) */
  el: number;
  /** This is the `endColumn` (the column, index 1, where this textual span ends) */
  ec: number;
}

export type HasSpan = { span: Nullable<TextualSpan> };

/**
 * This function places a collection of objects in the order in which they
 * appear in a file.  This **assumes they were parsed from the same file**.
 *
 * @param entites - The array of entities to sort
 */
export function spanOrder<T extends HasSpan>(entities: Array<T>): T[] {
  const ret: T[] = [...entities];
  ret.sort((a, b) => {
    if (a.span === null) {
      return b.span === null ? 0 : -1;
    }
    if (b.span === null) {
      return a.span === null ? 0 : 1;
    }
    if (a.span.sl < b.span.sl) {
      return -1;
    }
    if (a.span.sl > b.span.sl) {
      return 1;
    }
    if (a.span.sc < b.span.sc) {
      return -1;
    }
    if (a.span.sc > b.span.sc) {
      return 1;
    }
    return 0;
  });
  return ret;
}

/**
 * Determine the span that contains all of the given spans
 *
 * @category Structured Data
 *
 * @param spans
 * @returns
 */
export function boundingSpan(
  spans: Array<Nullable<TextualSpan>>
): Nullable<TextualSpan> {
  const span0 = spans[0];
  if (span0 === null) {
    return null;
  }
  const cur = { ...span0 };
  for (let i = 1; i < spans.length; i++) {
    const tspan = spans[i];
    if (tspan === null) {
      return null;
    }
    if (tspan.sl < cur.sl || (tspan.sl === cur.sl && tspan.sc < cur.sc)) {
      cur.sl = tspan.sl;
      cur.sc = tspan.sc;
    }
    if (tspan.el > cur.el || (tspan.el === cur.el && tspan.ec > cur.ec)) {
      cur.el = tspan.el;
      cur.ec = tspan.ec;
    }
  }
  return cur;
}

/**
 * Determines if a given Javascript value is an instance of `TextualSpan`
 *
 * @category Type Predicates
 * @param x
 * @returns
 */
export function isTextualSpan(x: any): x is TextualSpan {
  const obj = x;
  if (isObject(x)) {
    const sl = obj["sl"];
    const sc = obj["sc"];
    const el = obj["el"];
    const ec = obj["ec"];
    return (
      typeof sl === "number" &&
      typeof sc === "number" &&
      typeof el === "number" &&
      typeof ec === "number"
    );
  }
  return false;
}

/**
 * This is a subtype of `Problem` that includes information about the extend of
 * the problem within some textual span.
 *
 * NB - As of June 2024, the LSP protocol supports multi-line tokens (see
 * [`multilineTokenSupport`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/)).
 * However, VS Code (as a client) [does
 * not](https://github.com/microsoft/vscode/issues/200764).  So any problem that
 * spans past the end of the line will be truncated at the end of the start
 * line.
 *
 * For this reason, any downstream VS code extensions that leverage this information
 * will most likely need to break any multi-line spanning problem into multiple
 * diagnostics.
 *
 * These extra fields are null because there may be cases where we want to generate
 * these errors for text that hasn't been fully processed and, therefore, these
 * fields are not available.  This saves having to define two versions of the same
 * problem, one with span information and one without.
 *
 * @category Problems
 */
export interface ProblemSpan {
  file: Nullable<FileKey>;
  span: Nullable<TextualSpan>;
}

/**
 * Determines if a given Javascript value is an instance of `ProblemSpan`
 *
 * @category Type Predicates
 * @param x
 * @returns
 */
export function isProblemSpan(x: any): x is ProblemSpan {
  const obj = x;
  if (isObject(x)) {
    const file = obj["file"];
    const span = obj["span"];
    return (
      (file === null || isFileKey(file)) &&
      (span === null || isTextualSpan(span))
    );
  }
  return false;
}

/**
 * A `TextProblem` is a problem that is presumed to exist within some body of
 * text. The precisely location of the problem is specified in the `extra` field
 * of the `Problem` and conforms to the `ProblemSpan` type.
 *
 * @category Problems
 */
export type TextProblem = Problem<ProblemSpan>;

/**
 * This predicate determines if a given problem includes `ProblemSpan`
 * data in the `extra` field.
 *
 * @category Type Predicates
 * @param problem
 * @returns
 */
export function isTextProblem(problem: Problem): problem is TextProblem {
  return isProblemWith(problem, isProblemSpan);
}

/**
 * Creates a problem type with severity error and which includes
 * `ProblemSpan` information in the `extra` field.
 *
 * @category Problems
 */
export function spanError(
  type: string,
  title: string
): ProblemInstanceConstructor<ProblemSpan> {
  return problemError<ProblemSpan>(type, title);
}

/**
 * Creates a problem type with severity warning and which includes
 * `ProblemSpan` information in the `extra` field.
 *
 * @category Problems
 */
export function spanWarning(
  type: string,
  title: string
): ProblemInstanceConstructor<ProblemSpan> {
  return problemWarning<ProblemSpan>(type, title);
}

/**
 * Creates a problem type with severity info and which includes
 * `ProblemSpan` information in the `extra` field.
 *
 * @category Problems
 *
 */
export function spanInfo(
  type: string,
  title: string
): ProblemInstanceConstructor<ProblemSpan> {
  return problemInfo<ProblemSpan>(type, title);
}
