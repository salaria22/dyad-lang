import { ContinuitySet, isContinuitySet } from "./continuity.js";
import { Connection, isConnection } from "./connection";
import { Equation, isEquation } from "./equation";
import { ASTNode } from "./node";
import { Transition, isTransition } from "./transition";
import { AnalysisPoint, isAnalysisPoint } from "./analysis_point.js";
import { IfStatement, isIfStatement } from "./if.js";
import { isSwitchStatement, SwitchStatement } from "./switch.js";
import { Assertion, isAssertion } from "./assert.js";
import { ForLoopStatement } from "./forloop.js";

/**
 * The set of possible relation AST nodes
 *
 * @category AST Nodes
 */
export type Relation =
  | Equation
  | Connection
  | Transition
  | Assertion
  | ContinuitySet
  | AnalysisPoint
  | IfStatement
  | ForLoopStatement
  | SwitchStatement;

/**
 * Determines if a given `ASTNode` is an instance of `Relation`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isRelation(node: ASTNode | null): node is Relation {
  return (
    isEquation(node) ||
    isTransition(node) ||
    isConnection(node) ||
    isContinuitySet(node) ||
    isAnalysisPoint(node) ||
    isIfStatement(node) ||
    isAssertion(node) ||
    isSwitchStatement(node)
  );
}
