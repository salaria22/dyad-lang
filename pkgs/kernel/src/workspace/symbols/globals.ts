import {
  realLiteral,
  realType as qualifiedRealType,
  stringLiteral,
  assignmod,
} from "@juliacomputing/dyad-ast";
import { resolvedScalar } from "../index.js";
import { Just, Nothing } from "purify-ts/Maybe";
import {
  ConstantInstance,
  constantInstance,
} from "../../instantiate/constants.js";
import { realType } from "../newtypes/index.js";
import { VariableDeclarationType } from "../newtypes/types.js";

export const globalTypes = new Map<string, VariableDeclarationType>([
  ["time", realType({ units: Just("s") })],
  ["π", realType({})],
  ["pi", realType({})],
]);

export const globalTime = constantInstance(
  "time",
  resolvedScalar(qualifiedRealType, Nothing, null, {
    units: assignmod(stringLiteral("s", false, null), true),
  }),
  null,
  null
);

export const globalPiLetter = constantInstance(
  "π",
  resolvedScalar(qualifiedRealType, Nothing, null, {
    units: assignmod(stringLiteral("1", false, null), true),
  }),
  null,
  realLiteral(Math.PI, null, null, null)
);

export const globalPiWord = constantInstance(
  "pi",
  resolvedScalar(qualifiedRealType, Nothing, null, {
    units: assignmod(stringLiteral("1", false, null), true),
  }),
  null,
  realLiteral(Math.PI, null, null, null)
);

export const globalVariables: ConstantInstance[] = [
  globalTime,
  globalPiLetter,
  globalPiWord,
];
