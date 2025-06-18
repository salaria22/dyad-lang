/**
 * This contains various functions used to handle flow control in the context
 * of semantic analysis (catching Problems, etc)
 */

import { Problem, isProblem } from "@juliacomputing/dyad-common";
import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

/**
 * This function takes an either and returns the Right value if there is one.
 * If not, the _throws_ the left value.  This can be used in conjunction with
 * `catchProblem` to provide an "async/await" like experience when dealing with
 * `Either`s.
 */
export function unwrap<T, E>(x: Either<E, T>): T {
  return x.caseOf({
    Left: (e) => {
      throw e;
    },
    Right: (v) => {
      return v;
    },
  });
}

/**
 * This is an extremely useful function because it allows you to control the
 * exception thrown in the case of a Nothing (unlike `unsafeCoerce()`).
 **/
export function castOrThrow<T, E>(x: Maybe<T>, e: E): T {
  return x.caseOf({
    Nothing: () => {
      throw e;
    },
    Just: (v) => {
      return v;
    },
  });
}

/**
 * This function allows code that throws problems to be wrapped up such that the
 * problems are caught and resolved into an `Either`.  This is particularly
 * useful in conjunction with `unwrap` in avoiding deep sets of `chain`
 * operations and instead providing a more "async/await" like experience.
 *
 * @param f A function that either throws (a Problem) or resolved to a T
 * @returns An either of the the thrown Problem or the expected value
 */
export function catchProblem<T>(f: () => T): Either<Problem, T> {
  try {
    return Right(f());
  } catch (e) {
    if (isProblem(e)) {
      return Left(e);
    }
    throw e;
  }
}

export function catchEither<T>(f: () => T): Either<unknown, T> {
  try {
    return Right(f());
  } catch (e) {
    return Left(e);
  }
}

export async function catchEitherAsync<T>(
  f: () => Promise<T>
): Promise<Either<unknown, T>> {
  try {
    return Right(await f());
  } catch (e) {
    return Left(e);
  }
}
