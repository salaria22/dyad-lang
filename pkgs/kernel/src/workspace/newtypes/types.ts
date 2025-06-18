import { ComponentInstanceType } from "./component.js";
import { EnumType, isEnumType } from "./enum.js";
import { FunctionType, isFunctionType } from "./functions.js";
import { isScalarType, ScalarType } from "./scalar.js";
import { isStructType, StructType } from "./struct.js";
import { AnalysisInstanceType } from "./analysis.js";
import { ConnectorInstanceType } from "./connectors.js";
import { ArrayOf } from "./array.js";
import { ConditionalDeclaration } from "./conditional.js";

/**
 * Potential types for variables.  These correspond to types that can be defined
 * in Dyad.  When declared, additional variations are possible, see below.
 **/
export type VariableInstanceType =
  | ScalarType
  | FunctionType
  | EnumType
  | StructType;

/**
 * A predicate to determine if a given value is a variable instance type.
 *
 * @param t
 * @returns
 */
export function isVariableInstanceType(t: unknown): t is VariableInstanceType {
  return (
    isScalarType(t) || isFunctionType(t) || isEnumType(t) || isStructType(t)
  );
}

/**
 * In declarations, the ultimate type of the thing declared will fit one of the
 * pattenrns below.  So this type is just enumerating all of those possibilities
 * so we can work (safely) with the types of declared entities.
 */
export type ComplexType<T> =
  | T
  | ArrayOf<T>
  | ConditionalDeclaration<T>
  | ConditionalDeclaration<ArrayOf<T>>;

/** Something declared as a variable can have these types */
export type VariableDeclarationType = ComplexType<VariableInstanceType>;

/** Something declared as a connector can have these types */
export type ConnectorDeclarationType = ComplexType<ConnectorInstanceType>;

/**
 * Something declared as a component can have these types.
 */
export type ComponentDeclarationType = ComplexType<ComponentInstanceType>;

/**
 * Something declared as an analysis can have these types.  Currently, an
 * `analysis` is actually never declared (they cannot yet be nested).  But
 * this is to at least represent the possibility.
 */
export type AnalysisDeclarationType = ComplexType<AnalysisInstanceType>;

/**
 * This is the union of declaration types across all entities that can be
 * declared.
 */
export type DyadDeclarationType =
  | VariableDeclarationType
  | ConnectorDeclarationType
  | ComponentDeclarationType
  | AnalysisDeclarationType;

/**
 * These are the types that an entity can resolve to. If scalar types are
 * expanded to include array types, then `VariableInstanceType` would be
 * `VariableType`.
 *
 * I'm not 100% sure I'll need this.
 **/
export type EntityType =
  | VariableInstanceType
  | ConnectorInstanceType
  | ComponentInstanceType
  | AnalysisInstanceType;

/**
 * This just ensures that every element of the tagged union of types actually
 * contains a `resolves` field.
 */
export type ResolveableTypes = DyadDeclarationType["resolves"];
