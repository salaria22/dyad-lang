import {
  AnalysisDefinition,
  ComponentDefinition,
  ScalarConnectorDefinition,
  EnumTypeDefinition,
  StructConnectorDefinition,
  StructTypeDefinition,
  FunctionTypeDefinition,
} from "@juliacomputing/dyad-ast";
import { ResolvedScalarType } from "./scalar.js";

/**
 * Represents the `ResolvedType` for a `ComponentDefinition`
 */
export interface ResolvedAnalysisType {
  resolves: AnalysisDefinition["kind"];
  def: AnalysisDefinition;
}

export function analysisType(def: AnalysisDefinition): ResolvedAnalysisType {
  return {
    resolves: "adef",
    def,
  };
}

/**
 * Represents the `ResolvedType` for a `ComponentDefinition`
 */
export interface ResolvedComponentType {
  resolves: ComponentDefinition["kind"];
  def: ComponentDefinition;
}

export function componentType(def: ComponentDefinition): ResolvedComponentType {
  return {
    resolves: "cdef",
    def,
  };
}

/**
 * Represents the `ResolvedType` for a `DirectionConnectorDefinition`
 */
export interface ResolvedScalarConnectorType {
  resolves: ScalarConnectorDefinition["kind"];
  def: ScalarConnectorDefinition;
}

export function scalarConnectorType(
  def: ScalarConnectorDefinition
): ResolvedScalarConnectorType {
  return {
    resolves: "sclcon",
    def,
  };
}

/**
 * Represents the `ResolvedType` for a `RecordConnectorDefinition`
 */
export interface ResolvedStructConnectorType {
  resolves: StructConnectorDefinition["kind"];
  def: StructConnectorDefinition;
}

export function structConnectorType(
  def: StructConnectorDefinition
): ResolvedStructConnectorType {
  return {
    resolves: "strcon",
    def,
  };
}

/**
 * Represents the `ResolvedType` for a `RecordTypeDefinition`
 */
export interface ResolvedStructType {
  resolves: StructTypeDefinition["kind"];
  def: StructTypeDefinition;
}

export function structType(def: StructTypeDefinition): ResolvedStructType {
  return {
    resolves: "struct",
    def,
  };
}

/**
 * Represents the `ResolvedType` for a `EnumTypeDefinition`
 */
export interface ResolvedEnumType {
  resolves: EnumTypeDefinition["kind"];
  def: EnumTypeDefinition;
}

export function enumType(def: EnumTypeDefinition): ResolvedEnumType {
  return {
    resolves: "enum",
    def,
  };
}

/**
 * This is the type associated with functions brought into scope
 * as a result of a `using` statement.
 */
export interface ResolvedFunctionType {
  resolves: FunctionTypeDefinition["kind"];
  /** The function definition of the resolved function type */
  // TODO: Remove
  def: FunctionTypeDefinition;
  /** Resolved types of the positional arguments */
  positional: ResolvedType[];
  /** Resolved types of the keyword arguments */
  keyword: Record<string, ResolvedType>;
  /** Resolved types of the return values */
  returns: ResolvedType[];
}

export function functionType(
  def: FunctionTypeDefinition,
  positional: ResolvedType[],
  keyword: Record<string, ResolvedType>,
  returns: ResolvedType[]
): ResolvedFunctionType {
  return {
    resolves: "fun",
    def,
    positional,
    keyword,
    returns,
  };
}

export type ResolvedConnectorType =
  | ResolvedStructConnectorType
  | ResolvedScalarConnectorType;

/**
 * The union of all the different types that can be resolved
 */
export type ResolvedType =
  | ResolvedAnalysisType
  | ResolvedComponentType
  | ResolvedConnectorType
  | ResolvedFunctionType
  | ResolvedStructType
  | ResolvedEnumType
  | ResolvedScalarType
  | ResolvedFunctionType;
