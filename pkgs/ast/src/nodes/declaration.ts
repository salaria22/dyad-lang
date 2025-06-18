import { ASTNode } from "./node.js";
import {
  ComponentDeclaration,
  isComponentDeclaration,
} from "./component_declaration.js";
import { VariableDeclaration, isVariableDeclaration } from "./variable.js";

/** Lists all the possible declaration types
 *
 * @category AST Nodes
 */
export type Declaration = ComponentDeclaration | VariableDeclaration;

/** Predicate to determine if a particular `ASTNode` is an instance of a `Declaration`
 *
 * @category Type Predicates
 **/
export function isDeclaration(x: ASTNode | null): x is Declaration {
  return isVariableDeclaration(x) || isComponentDeclaration(x);
}
