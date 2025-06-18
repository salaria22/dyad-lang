import { Problem } from "../problem.js";

/** An enumeration of possible outcomes and closure signatures to handle each */
export interface ResultCases<T, R> {
  success(v: T): R;
  warnings(v: T, warnings: Array<Problem>): R;
  errors(errors: [Problem, ...Problem[]]): R;
}
