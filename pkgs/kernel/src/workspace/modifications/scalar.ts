import {
  Expression,
  expressionSpan,
  FileLevelNode,
  hasExpression,
  hasNested,
  Modifications,
} from "@juliacomputing/dyad-ast";
import {
  assertUnreachable,
  partialResult,
  Problem,
  Result,
} from "@juliacomputing/dyad-common";
import { ScalarType } from "../newtypes/index.js";
import {
  missingValue,
  unexpectedValue,
  unknownElement,
} from "../../instantiate/errors.js";
import { problemSpan } from "../utils.js";
import { Just, Maybe, Nothing } from "purify-ts";
import { unparseExpression } from "@juliacomputing/dyad-parser";

/**
 * This function applies a set of modifications to a scalar type.
 * @param t The initial type
 * @param mod The modifications to apply
 * @param file FileLevelNode that this modification is being performed in
 * @returns The type with modifications applied
 */
export function applyModificationToScalarType(
  t: ScalarType,
  mod: Modifications,
  file: FileLevelNode
): Result<ScalarType> {
  const problems: Problem[] = [];
  const unexpected = (key: string, val: Expression) => {
    problems.push(
      unexpectedValue(
        key,
        `Expected real, but value of ${key} was ${unparseExpression(val)}`,
        problemSpan(file, expressionSpan(val))
      )
    );
  };
  const unknown = (key: string, val: Expression) => {
    problems.push(
      unknownElement(
        key,
        `Unknown attribute ${key} of type ${ret.resolves}`,
        problemSpan(file, expressionSpan(val))
      )
    );
  };
  const real = (key: string, val: Expression): Maybe<number> => {
    switch (val.type) {
      case "rlit":
      case "ilit":
        return Just(val.value);
      default:
        unexpected(key, val);
      case "ulit":
        return Nothing;
    }
  };
  const int = (key: string, val: Expression): Maybe<number> => {
    switch (val.type) {
      case "ilit":
        return Just(val.value);
      default:
        unexpected(key, val);
      case "ulit":
        return Nothing;
    }
  };
  const boolean = (key: string, val: Expression): Maybe<boolean> => {
    switch (val.type) {
      case "blit":
        return Just(val.value);
      default:
        unexpected(key, val);
      case "ulit":
        return Nothing;
    }
  };
  const string = (key: string, val: Expression): Maybe<string> => {
    switch (val.type) {
      case "slit":
        return Just(val.value);
      default:
        unexpected(key, val);
      case "ulit":
        return Nothing;
    }
  };
  const ret = { ...t };
  for (const [key, m] of Object.entries(mod)) {
    if (!hasExpression(m) || hasNested(m)) {
      problems.push(
        missingValue(
          key,
          `modifications on scalar types should be simple values`,
          problemSpan(file, m.span)
        )
      );
      continue;
    }
    const val = m.expr;
    switch (ret.resolves) {
      case "Real":
        switch (key) {
          case "guess":
            ret.guess = real(key, val);
            break;
          case "statePriority":
            ret.statePriority = int(key, val);
            break;
          case "min":
            ret.min = real(key, val);
            break;
          case "max":
            ret.max = real(key, val);
            break;
          case "units":
            ret.units = string(key, val);
            break;
          case "quantity":
            ret.quantity = string(key, val);
            break;
          case "displayUnits":
            ret.displayUnits = string(key, val);
            break;
          default:
            unknown(key, val);
            break;
        }
        break;
      case "Integer":
        switch (key) {
          case "guess":
            ret.guess = int(key, val);
            break;
          case "min":
            ret.min = int(key, val);
            break;
          case "max":
            ret.max = int(key, val);
            break;
          case "units":
            ret.units = string(key, val);
            break;
          case "quantity":
            ret.quantity = string(key, val);
            break;
          case "displayUnits":
            ret.displayUnits = string(key, val);
            break;
          default:
            unknown(key, val);
            break;
        }
        break;
      case "Boolean":
        switch (key) {
          case "guess":
            ret.guess = boolean(key, val);
          case "quantity":
            ret.quantity = string(key, val);
            break;
          default:
            unknown(key, val);
            break;
        }
        break;
      case "String":
      case "Native":
        unknown(key, val);
        break;
      default:
        assertUnreachable(ret);
    }
  }
  return partialResult(ret, ...problems);
}
