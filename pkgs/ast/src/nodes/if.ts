import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "../expr/index.js";
import {
  MetadataNode,
  DocString,
  TextualSpan,
  Relation,
  ASTNode,
  possibleMetadata,
  childArray,
  Children,
} from "./index.js";

/**
 * A node in the abstract syntax used to represent an if statement
 *
 * @category AST Nodes
 */
export interface IfStatement {
  kind: "ifs";
  /** The condition associated with this if statement */
  cond: Expression;
  /** Any "else if" contingencies associated with this if statement */
  elif: ElseIfClause[];
  /** The relations that are active if the if statement condition is true */
  yes: Relation[];
  /** The relations that are active if the if statement condition is false */
  no: Relation[];
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * Create an `IfStatement` node
 *
 * @category AST Nodes
 *
 * @param cond The condition associated with this if statement
 * @param elif Any "else if" contingencies associated with this if statement
 * @param yes The relations that are active if the if statement condition is true
 * @param no The relations that are active if the if statement condition is false
 * @param doc_string The (optional) doc string associated with this equation
 * @param metadata Any (optional) metadata associated with this equation
 * @param span Span of if statement in the AST
 *
 * @returns Instance of `IfStatement`
 */
export function ifStatement(
  cond: Expression,
  elif: ElseIfClause[],
  yes: Relation[],
  no: Relation[],
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): IfStatement {
  return {
    kind: "ifs",
    cond,
    elif,
    yes,
    no,
    doc_string,
    metadata,
    span,
  };
}

/**
 * This is a predicate to determine if a given `ASTNode` is an instance of any
 * of the `IfStatement` types.
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns True if the node is an instance of `IfStatement`
 */
export function isIfStatement(node: ASTNode | null): node is IfStatement {
  return node != null && node.kind == "ifs";
}

/**
 * List the children of an `IfStatement` node
 *
 * @category Navigation
 * @param node
 * @returns Child nodes
 */
export function ifStatementChildren(node: IfStatement): Children {
  const ret = possibleMetadata(node);
  const elif = childArray("elif", node);
  const yes = childArray("yes", node);
  const no = childArray("no", node);

  return { ...ret, ...elif, ...yes, ...no };
}

/**
 * A node in the abstract syntax used to represent an "elseif" clause
 * in an if statement.
 *
 * @category AST Nodes
 */
export interface ElseIfClause {
  kind: "elif";
  /** The condition associated with this else if contingency */
  cond: Expression;
  /** The relations that are active when the above condition is true */
  rels: Relation[];
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * Create an `ElseIfClause` node
 *
 * @category AST Nodes
 *
 * @param cond The condition associated with this else if clause
 * @param rels The relations that are active if the condition is true
 * @param span Span of else if clause in the AST
 *
 * @returns Instance of `IfStatement`
 */
export function elseIfClause(
  cond: Expression,
  rels: Relation[],
  span: Nullable<TextualSpan>
): ElseIfClause {
  return {
    kind: "elif",
    cond,
    rels,
    span,
  };
}

/**
 * This is a predicate to determine if a given `ASTNode` is an instance of any
 * of the `ElseIfClause` types.
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns True if the node is an instance of `ElseIfClause`
 */
export function isElseIfClause(node: ASTNode | null): node is ElseIfClause {
  return node != null && node.kind == "elif";
}

/**
 * List the children of an `ElseIfClause` node
 *
 * @category Navigation
 * @param node
 * @returns Child nodes
 */
export function elseIfClauseChildren(node: ElseIfClause): Children {
  const ret = {};
  const rels = childArray("rels", node);
  return { ...ret, ...rels };
}
