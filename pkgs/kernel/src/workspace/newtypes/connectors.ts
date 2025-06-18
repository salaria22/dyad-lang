import {
  ConnectorVariableQualifiers,
  ScalarConnectorDefinition,
} from "@juliacomputing/dyad-ast";
import { VariableDeclarationType } from "./types.js";
import { FieldElement } from "./declaration.js";

export type CompoundConnectorFieldAnnotation = {
  qualifiers: ConnectorVariableQualifiers;
};

/**
 * A type that represents an instance of a compound connector.
 */
export interface CompoundConnectorInstanceType {
  resolves: "ccon";
  fields: Map<string, FieldElement>;
}

/**
 * Create a type that represents an instance of a compound connector
 */
export function compoundConnectorInstanceType(): CompoundConnectorInstanceType {
  return {
    resolves: "ccon",
    fields: new Map(),
  };
}

/**
 * Predicate to determine if a value is a compound connector instance type
 *
 * @param t
 * @returns
 */
export function isCompoundConnectorInstanceType(
  t: unknown
): t is CompoundConnectorInstanceType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "ccon"
  );
}

export type ScalarTypeQualifier = ScalarConnectorDefinition["qualifier"];

/**
 * A type that represents an instance of a scalar connector
 */
export interface ScalarConnectorInstanceType {
  resolves: "scon";
  type: VariableDeclarationType;
  qualifier: ScalarTypeQualifier;
}

/**
 * Create a type that represents an instance of a scalar connector
 */
export function scalarConnectorInstanceType(
  type: VariableDeclarationType,
  qualifier: ScalarTypeQualifier
): ScalarConnectorInstanceType {
  return {
    resolves: "scon",
    type,
    qualifier,
  };
}

/**
 * Predicate to determine if a value is a scalar connector instance type
 *
 * @param t
 * @returns
 */
export function isScalarConnectorInstanceType(
  t: unknown
): t is ScalarConnectorInstanceType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "scon"
  );
}

export type ConnectorInstanceType =
  | CompoundConnectorInstanceType
  | ScalarConnectorInstanceType;

/**
 * Predicate to determine if a value is a connector instance type
 *
 * @param t
 * @returns
 */
export function isConnectorInstanceType(
  t: unknown
): t is ConnectorInstanceType {
  return isCompoundConnectorInstanceType(t) || isScalarConnectorInstanceType(t);
}
