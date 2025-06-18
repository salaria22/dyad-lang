import { ASTNode } from "./node.js";
import { StructTypeDefinition, isStructTypeDefinition } from "./struct.js";
import { ScalarTypeDefinition, isScalarTypeDefinition } from "./scalar.js";
import { EnumTypeDefinition, isEnumTypeDefinition } from "./enum.js";
import {
  FunctionTypeDefinition,
  isFunctionTypeDefinition,
} from "./function.js";

/** List of all nodes that can be used to define a type
 *
 * @category AST Nodes
 */
export type TypeDefinition =
  | ScalarTypeDefinition
  | StructTypeDefinition
  | FunctionTypeDefinition
  | EnumTypeDefinition;

/** Predicate to determine if a given `ASTNode` is a `TypeDefinition` node
 *
 * @category Type Predicates
 **/
export function isTypeDefinition(x: ASTNode | null): x is TypeDefinition {
  return (
    isScalarTypeDefinition(x) ||
    isStructTypeDefinition(x) ||
    isFunctionTypeDefinition(x) ||
    isEnumTypeDefinition(x)
  );
}
