import { DefinitionEntity } from "../entities/definitions.js";
import {
  ComponentDeclarationType,
  ConnectorDeclarationType,
  VariableDeclarationType,
} from "./types.js";
import {
  ConnectorVariableQualifiers,
  VariableDeclaration,
} from "@juliacomputing/dyad-ast";

/**
 * This is information specifically about fields inside either
 * connector definitions.
 */
export interface FieldElement {
  type: VariableDeclarationType;
  origin: DefinitionEntity;
  qualifier: ConnectorVariableQualifiers;
}

/** Create a `FieldElement` instance */
export function fieldElement(
  type: VariableDeclarationType,
  origin: DefinitionEntity,
  qualifier: ConnectorVariableQualifiers
): FieldElement {
  return { type, origin, qualifier };
}

/**
 * This is information specifically about connectors inside either
 * component definitions.
 */
export interface ConnectorElement {
  elem: "connector";
  type: ConnectorDeclarationType;
  origin: DefinitionEntity;
}

/** Create a `ConnectorElement` instance */
export function connectorElement(
  type: ConnectorDeclarationType,
  origin: DefinitionEntity
): ConnectorElement {
  return { elem: "connector", type, origin };
}

/**
 * This is information specifically about parameters inside either
 * component or analysis definitions.
 */
export interface VariableElement {
  elem: "variable";
  type: VariableDeclarationType;
  origin: DefinitionEntity;
  final: boolean;
  variability: VariableDeclaration["variability"];
}

/** Create a `VariableElement` instance */
export function variableElement(
  type: VariableDeclarationType,
  origin: DefinitionEntity,
  final: boolean,
  variability: VariableDeclaration["variability"]
): VariableElement {
  return { elem: "variable", type, origin, final, variability };
}

/**
 * This is information specifically about components inside either
 * component or analysis definitions.
 */
export interface ComponentElement {
  elem: "component";
  type: ComponentDeclarationType;
  origin: DefinitionEntity;
  final: boolean;
}

/** Create a `ComponentElement` instance */
export function componentElement(
  type: ComponentDeclarationType,
  origin: DefinitionEntity,
  final: boolean
): ComponentElement {
  return { elem: "component", type, origin, final };
}
