import {
  hasExpression,
  Modifications,
  qualifiedName,
  QualifiedType,
  ScalarTypeDefinition,
  SourceKey,
} from "@juliacomputing/dyad-ast";
import { Maybe, Nothing } from "purify-ts/Maybe";
import { ResolvedType } from "./types.js";
import {
  getIntEither,
  getRealEither,
  getStringEither,
} from "../../codegen/schemas.js";
import { Nullable } from "@juliacomputing/dyad-common";

/**
 * Represents the `ResolvedType` for a `ScalarTypeDefinition` (or potentially a built-in scalar type)
 */
export interface ResolvedScalarType {
  resolves: ScalarTypeDefinition["kind"];
  /**
   * The scalar type definition that this resolves if it wasn't a built-in type
   */
  derived: Maybe<ScalarTypeDefinition>;
  /**
   * Base type that this type is ultimately derived from
   */
  base: QualifiedType;
  /** Location of this scalar type */
  source: Nullable<SourceKey>;
  /**
   * Cumulative modifications
   */
  mods: Modifications;
}

export function resolvedScalar(
  base: QualifiedType,
  derived: Maybe<ScalarTypeDefinition>,
  source: Nullable<SourceKey>,
  mods: Modifications
): ResolvedScalarType {
  return {
    resolves: "scalar",
    derived,
    base,
    source,
    mods,
  };
}

export function isScalarType(x: ResolvedType): x is ResolvedScalarType {
  return x.resolves === "scalar";
}

export function isBooleanType(x: ResolvedType): x is ResolvedScalarType {
  return isScalarType(x) && qualifiedName(x.base) === "Boolean";
}

export function isIntegerType(x: ResolvedType): x is ResolvedScalarType {
  return isScalarType(x) && qualifiedName(x.base) === "Integer";
}

export function isRealType(x: ResolvedType): x is ResolvedScalarType {
  return isScalarType(x) && qualifiedName(x.base) === "Real";
}

export function isStringType(x: ResolvedType): x is ResolvedScalarType {
  return isScalarType(x) && qualifiedName(x.base) === "String";
}

export function isNumericType(x: ResolvedType): x is ResolvedScalarType {
  return isRealType(x) || isIntegerType(x);
}

export function getMaxAttribute(mods: Modifications): Maybe<number> {
  const e = mods["max"];
  if (e === undefined || !hasExpression(e)) {
    return Nothing;
  }
  return getIntEither(e.expr).alt(getRealEither(e.expr)).toMaybe();
}

export function getDefaultAttribute(mods: Modifications): Maybe<number> {
  const e = mods["default"];
  if (e === undefined || !hasExpression(e)) {
    return Nothing;
  }
  return getIntEither(e.expr).alt(getRealEither(e.expr)).toMaybe();
}

export function getMinAttribute(mods: Modifications): Maybe<number> {
  const e = mods["min"];
  if (e === undefined || !hasExpression(e)) {
    return Nothing;
  }
  return getIntEither(e.expr).alt(getRealEither(e.expr)).toMaybe();
}

export function getUnitsAttribute(mods: Modifications): Maybe<string> {
  const e = mods["units"];
  if (e === undefined || !hasExpression(e)) {
    return Nothing;
  }
  return getStringEither(e.expr).toMaybe();
}

export function promotedType(
  x: ResolvedScalarType,
  y: ResolvedScalarType
): ResolvedScalarType {
  if (isIntegerType(x) && isIntegerType(y)) {
    return x;
  }
  if (isRealType(x)) {
    return x;
  }
  return y;
}
