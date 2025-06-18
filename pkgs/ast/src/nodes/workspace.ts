import { Children, childArray } from "./children.js";
import { DyadLibrary } from "./library.js";
import { ASTNode } from "./node.js";

/**
 * Information associated with a workspace.  This is the root node of our
 * abstract syntax tree.
 *
 * @category AST Nodes
 */
export interface WorkspaceNode {
  kind: "workspace";
  libraries: DyadLibrary[];
}

/**
 * List the children of a `WorkspaceNode` node
 *
 * @category Navigation
 * @param node
 * @returns
 */
export function workspaceNodeChildren(node: WorkspaceNode): Children {
  return childArray("libraries", node);
}

/** Constructor for a `Workspace` node
 *
 * @category AST Nodes
 */
export function workspace(lib: DyadLibrary[]): WorkspaceNode {
  return {
    kind: "workspace",
    libraries: lib,
  };
}

/** Predicate to determine if a given `ASTNode` is a `WorkspaceNode`
 *
 * @category Type Predicates
 **/
export function isWorkspace(node: ASTNode): node is WorkspaceNode {
  return node.kind === "workspace";
}
