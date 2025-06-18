import { toProblems } from "../bundled.js";
import { Problem } from "../problem.js";

/**
 * This function is used to wrap arbitrary code that may throw exceptions and to
 * then collect those exceptions and add them to any existing problems.
 *
 * @param problems
 * @param f
 */
export function catchProblems(problems: Problem[], f: () => void): void {
  try {
    f();
  } catch (e) {
    problems.push(...toProblems(e));
  }
}
