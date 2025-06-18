import {
  booleanLiteral,
  integerLiteral,
  realLiteral,
  undefinedLiteral,
} from "../expr/literals.js";
import { assignmod, modification } from "./modifications.js";
import { QualifiedType, qualifiedType } from "./qualifier.js";
import { createToken } from "./token.js";

export const realType = qualifiedType(
  [createToken("Real", null)],
  {
    guess: assignmod(undefinedLiteral(null), false), // Real
    statePriority: assignmod(integerLiteral(0, null, null, "0"), false), // This is called state_priority in MTK and stateSelect in Modelica
    min: assignmod(undefinedLiteral(null), false), // Real
    max: assignmod(undefinedLiteral(null), false), // Real
    nominal: assignmod(undefinedLiteral(null), false), // Real
    minInclusive: assignmod(undefinedLiteral(null), false), // Boolean
    maxInclusive: assignmod(undefinedLiteral(null), false), // Boolean
    units: assignmod(undefinedLiteral(null), false),
    quantity: assignmod(undefinedLiteral(null), false), // String indicating what the value represents
    displayUnits: assignmod(undefinedLiteral(null), false), // Units to use when visualizing (vs units of equations)
  },
  null
);

export const integerType = qualifiedType(
  [createToken("Integer", null)],
  {
    guess: assignmod(integerLiteral(0, null, null, "0"), false), // Useful for fixed point iteration?
    min: assignmod(undefinedLiteral(null), false),
    max: assignmod(undefinedLiteral(null), false),
    units: assignmod(undefinedLiteral(null), false),
    quantity: assignmod(undefinedLiteral(null), false), // String indicating what the value represents
    displayUnits: assignmod(undefinedLiteral(null), false), // Units to use when visualizing (vs units of equations)
  },
  null
);

export const booleanType = qualifiedType(
  [createToken("Boolean", null)],
  {
    guess: assignmod(booleanLiteral(false, null), false), // Useful for fixed point iteration?
  },
  null
);

export const stringType = qualifiedType(
  [createToken("String", null)],
  {},
  null
);

export const nativeType = qualifiedType(
  [createToken("Native", null)],
  {},
  null
);

/** A list of all builtin types (represented by `TypeQualifier` instances)
 *
 * @category Constants
 */
export const builtinTypes: Array<QualifiedType> = [
  realType,
  integerType,
  booleanType,
  stringType,
  nativeType,
] as const;
