import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { ASTNode, nodeChildren } from "@juliacomputing/dyad-ast";

/**
 * This interface externalizes the actions taken when entering and leaving an
 * AST Node (without having to worry about implementing the actual tree
 * traversal).
 */
export interface ASTWalker<T> {
  /**
   * This method is called before any children have been visited.
   *
   * @param node Node being visited
   * @parem parent Parent node of the node being visited (if one exists)
   * @returns A boolean indicating whether to visit the children
   */
  enter(node: ASTNode, parent: Maybe<T>, curPath: string): boolean;
  leave(node: ASTNode, parent: Maybe<T>, curPath: string): void;
}

/**
 * Visit every node in a tree using the provided `walker` implementation.
 *
 * @param node Start node for the traversal
 * @param walker The `ASTWalker` implementation to use
 * @param parent The parent of the start node (default is that `node` is a root nodee)
 * @returns nothing
 */
export function walkAST(
  node: ASTNode,
  walker: ASTWalker<ASTNode>,
  parent: Maybe<ASTNode> = Nothing
): void {
  return mapWalkAST<ASTNode>(
    node,
    walker,
    (node: ASTNode, parent: Maybe<ASTNode>) => parent,
    parent,
    parent,
    ""
  );
}

// FIX: Rewrite using a utility function that provides the path of all children.  It
// should be easier to identify missed traversals in such a case (perhaps even create
// tests that search for nodes with a `kind` field that don't show up as children?)
export function mapWalkAST<T>(
  node: ASTNode,
  walker: ASTWalker<T>,
  f: (
    x: ASTNode,
    parent: Maybe<ASTNode>,
    parentValue: Maybe<T>,
    curPath: string
  ) => Maybe<T>,
  parent: Maybe<ASTNode> = Nothing,
  parentValue: Maybe<T> = Nothing,
  curPath: string
): void {
  const me = f(node, parent, parentValue, curPath);
  const recurse = (child: ASTNode, path: string) => {
    mapWalkAST(child, walker, f, Just(node), me, path);
  };
  if (walker.enter(node, me, curPath)) {
    const children = nodeChildren(node);
    for (const [name, child] of Object.entries(children)) {
      recurse(child, `${curPath}.${name}`);
    }
  }
  walker.leave(node, me, curPath);
}
