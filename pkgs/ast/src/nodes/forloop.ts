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
  Indices,
} from "./index.js";

/**
 * A node in the abstract syntax used to represent an forl statement
 *
 * @category AST Nodes
 */
export interface ForLoopStatement {
  kind: "forl";
  /** Loop indices */
  indices: Indices;
  /** The relations that are to be repeated */
  relations: Relation[];
  /** The (optional) doc string associated with this equation */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this equation */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * Create an `ForLoopStatement` node
 *
 * @category AST Nodes
 *
 * @param indices The indices to loop over
 * @param relations The relations to repeat
 * @param doc_string The (optional) doc string associated with this equation
 * @param metadata Any (optional) metadata associated with this equation
 * @param span Span of forl statement in the AST
 *
 * @returns Instance of `ForLoopStatement`
 */
export function forLoopStatement(
  indices: Indices,
  relations: Relation[],
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): ForLoopStatement {
  return {
    kind: "forl",
    indices,
    relations,
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
export function isForLoopStatement(
  node: ASTNode | null
): node is ForLoopStatement {
  return node != null && node.kind == "forl";
}

/**
 * List the children of an `IfStatement` node
 *
 * @category Navigation
 * @param node
 * @returns Child nodes
 */
export function forLoopStatementChildren(node: ForLoopStatement): Children {
  const ret = possibleMetadata(node);
  const rels = childArray("relations", node);

  return { ...ret, ...rels };
}
