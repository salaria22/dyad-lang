import {
  ScalarConnectorDefinition,
  StructConnectorDefinition,
  isConnectorDefinition,
} from "./connector.js";
import {
  ComponentDefinition,
  isComponentDefinition,
} from "./component_definition.js";
import { ASTNode } from "./node.js";
import { TypeDefinition, isTypeDefinition } from "./types.js";
import { AnalysisDefinition, isAnalysisDefinition } from "./analysis.js";

/**
 * This is the union of all possible definitions in Dyad
 *
 * @category AST Nodes
 */
export type Definition =
  | TypeDefinition
  | AnalysisDefinition
  | ComponentDefinition
  | StructConnectorDefinition
  | ScalarConnectorDefinition;

/**
 * This is a predicate to determine if a given `ASTNode` is an instance of any
 * of the `Definition` types.
 *
 * @category Type Predicates
 *
 * @param node
 * @returns
 */
export function isDefinition(node: ASTNode | null): node is Definition {
  return (
    isTypeDefinition(node) ||
    isAnalysisDefinition(node) ||
    isComponentDefinition(node) ||
    isConnectorDefinition(node)
  );
}
