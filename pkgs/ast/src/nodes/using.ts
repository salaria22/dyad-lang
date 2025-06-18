import { Nullable } from "@juliacomputing/dyad-common";
import { Children } from "./children.js";
import { ASTNode } from "./node.js";
import { QualifiedType } from "./qualifier.js";
import { Token } from "./token.js";
import { SourceKey } from "./keys.js";

/**
 * Information about symbols being "used".  The token for the symbol is
 * mandator.  Information about the type of that symbol is only required when
 * the symbol is external (_i.e.,_ when it originates from Julia and not from
 * Dyad).  It is an error if the type information is provided for any symbol
 * originating in Dyad (since it is completely superfluous and potentially
 * wrong).
 */
export interface SymbolInformation {
  symbol: Token;
  type: Nullable<QualifiedType>;
}

/** Information contained in a using statement
 *
 * @category AST Nodes
 */
export interface UsingStatement {
  kind: "using";
  /** What module is being referenced */
  module: Token;
  /** Any specific symbols that are used (otherwise assume all symbols) */
  symbols: SymbolInformation[];
  /** Source file */
  source: Nullable<SourceKey>;
}

export function usingStatement(
  module: Token,
  symbols: SymbolInformation[],
  source: Nullable<SourceKey>
): UsingStatement {
  return {
    kind: "using",
    module,
    symbols,
    source,
  };
}

/**
 * List the children of a `UsingStatement` node
 *
 * @category Navigation
 * @param node
 * @returns
 */
export function usingStatementChildren(node: UsingStatement): Children {
  return {};
}

/**
 * Determines if a given instance of `ASTNode` is an instance of `UsingStatement`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isUsingStatement(node: ASTNode | null): node is UsingStatement {
  return node !== null && node.kind === "using";
}
