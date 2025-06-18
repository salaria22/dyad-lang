import { Children } from "./children.js";
import { TextualSpan } from "./span.js";
import { Modifications } from "./modifications.js";
import { ASTNode } from "./node.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";

/** Node representing the specification of type and any modifications to that type
 *
 * @category AST Nodes
 */
export interface QualifiedType {
  kind: "qtype";
  /**
   * This is the qualified type name.  It is either a fully qualified name (resolved at *global scope* or it is a simple
   * type name with a single element and resolved in local scope.)
   */
  name: Token[];
  /**
   * One reason to include modifications here (i.e., include them as part of the "type" is that they might
   * redeclare nested types)
   **/
  mods: Nullable<Modifications>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * List the children of a `QualifiedType` node
 *
 * @category Navigation
 * @param qual
 * @returns
 */
export function qualifiedTypeChildren(qual: QualifiedType): Children {
  return {};
}

/** Constructor for a type qualifier node
 *
 * @category AST Nodes
 */
export function qualifiedType(
  name: Token[],
  mods: Nullable<Modifications>,
  span: Nullable<TextualSpan>
): QualifiedType {
  return { kind: "qtype", name, mods, span };
}

/** Predicate to determine if a given `ASTNode` is a `QualifiedType`
 *
 * @category Type Predicates
 **/
export function isQualifiedType(n: ASTNode | null): n is QualifiedType {
  return n !== null && n.kind === "qtype";
}

/**
 * This function returns the `.` separated fully qualified type name
 *
 * @category AST Nodes
 *
 * @param n Qualified type
 * @returns
 */
export function qualifiedName(n: QualifiedType): string {
  return n.name.map((x) => x.value).join(".");
}
