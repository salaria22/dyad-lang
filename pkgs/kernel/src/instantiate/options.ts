import {
  Expression,
  expressionSpan,
  FileLevelNode,
  ProblemSpan,
} from "@juliacomputing/dyad-ast";
import {
  problemError,
  Problem,
  ProblemInstanceConstructor,
} from "@juliacomputing/dyad-common";
import { Either, Left, Right } from "purify-ts/Either";
import { getStringEither } from "../codegen/index.js";
import { integratorOptions } from "./transient.js";
import { problemSpan } from "../workspace/utils.js";

export const invalidOption: ProblemInstanceConstructor<ProblemSpan> =
  problemError("invalid-option", "Invalid options");

export function resolveOption<T extends string>(
  val: Expression,
  opts: readonly T[],
  context: FileLevelNode
): Either<Problem, T> {
  return getStringEither(val).chain((str) => {
    const idx = opts.findIndex((i) => str.toLowerCase() === i.toLowerCase());
    if (idx === -1) {
      return Left(
        invalidOption(
          str,
          `Unexpected value '${str}', valid options: ${integratorOptions.join(
            ", "
          )}`,
          problemSpan(context, expressionSpan(val))
        )
      );
    }
    return Right(opts[idx]);
  });
}
