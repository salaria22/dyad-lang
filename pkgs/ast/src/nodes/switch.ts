import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "../expr/index.js";
import { ASTNode } from "./node.js";
import { Relation } from "./relations.js";
import { Token } from "./token.js";
import {
  childArray,
  Children,
  DocString,
  MetadataNode,
  possibleMetadata,
  TextualSpan,
} from "./index.js";

/**
 * A node in the abstract syntax used to represent a switch
 *
 * @category AST Nodes
 *
 */
export interface SwitchStatement {
  kind: "sw";
  /** The value to switch on.  Should be of an enum type. */
  val: Expression;
  /** The case clauses associated with this switch statement */
  cases: CaseClause[];
  /** Name (if named) */
  name: Nullable<Token>;
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * Create a `SwitchStatement` node
 *
 * @category AST Nodes
 *
 * @param val The value to switch on.  Should be of an enum type.
 * @param case The case clauses associated with this switch statement
 * @param otherwise The relations associated with the default contingency
 *
 * @returns Instance of `SwitchStatement
 */
export function switchStatement(
  val: Expression,
  cases: CaseClause[],
  name: Nullable<Token>,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): SwitchStatement {
  return {
    kind: "sw",
    val,
    cases,
    name,
    doc_string,
    metadata,
    span,
  };
}

/**
 * This is a predicate to determine if a given `ASTNode` is an instance
 * of the `SwitchStatement` type.
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns True if the node is an instance of `SwitchStatement`
 */
export function isSwitchStatement(
  node: ASTNode | null
): node is SwitchStatement {
  return node != null && node.kind == "sw";
}

/**
 * List the children of an `SwitchStatement` node
 *
 * @category Navigation
 * @param sw
 * @returns Child nodes
 */
export function switchStatementChildren(sw: SwitchStatement): Children {
  const ret = possibleMetadata(sw);
  const cases = childArray("cases", sw);
  return { ...ret, ...cases };
}

/**
 * A node in the abstract syntax used to represent a case in a switch
 * statement.
 *
 * @category AST Nodes
 *
 */
export interface CaseClause {
  kind: "casec";
  /**
   * The identifier used in the case statement (should be one of the enum possibilities)
   * If this has the value of "default", then this represents the default case.
   **/
  caseid: Token;
  /** The set of relations that are active for this case */
  rels: Relation[];
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * Constructor for an `CaseClause` node
 *
 * @category AST Nodes
 */
export function caseClause(
  caseid: Token,
  rels: Relation[],
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): CaseClause {
  return {
    kind: "casec",
    caseid,
    rels,
    doc_string,
    metadata,
    span,
  };
}

/**
 * This is a predicate to determine if a given `ASTNode` is an instance
 * of the `CaseClause` type.
 *
 * @category Type Predicates
 *
 * @param node Node to check
 * @returns True if the node is an instance of `CaseClause`
 */
export function isCaseClause(node: ASTNode | null): node is CaseClause {
  return node != null && node.kind == "casec";
}

/**
 * List the children of an `CaseClause` node
 *
 * @category Navigation
 * @param node
 * @returns Child nodes
 */
export function caseClauseChildren(node: CaseClause): Children {
  const ret = possibleMetadata(node);
  const rels = childArray("rels", node);

  return { ...ret, ...rels };
}
