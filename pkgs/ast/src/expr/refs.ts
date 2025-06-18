import { Nullable } from "@juliacomputing/dyad-common";
import { Expression } from "./expr.js";
import { TextualSpan } from "../nodes/span.js";

/** Node that stores all indices used when dereferencing a variable
 *
 * @category Structured Data
 */
export interface Deref {
  name: string;
  indices: Array<Expression>;
  span: Nullable<TextualSpan>;
}

/**
 * Construct an instance of `Deref`
 *
 * @category Structured Data
 *
 * @param name
 * @param indices
 * @param span
 * @returns
 */
export function deref(
  name: string,
  indices: Array<Expression>,
  span: Nullable<TextualSpan>
): Deref {
  return { name, indices, span };
}

/** Node that contains a references a component in a hierarchy
 *
 * @category Expression Nodes
 **/
export interface CompRef {
  type: "cref";
  elems: Array<Deref>;
}

/** Constructor for creating a component reference node
 *
 * @category Expression Nodes
 **/
export function compRef(elems: Array<Deref>): CompRef {
  return { type: "cref", elems };
}

/** Predicate to determine if a given value is an instance of a `CompRef`
 *
 * @category Type Predicates
 **/
export function isCompRef(a: unknown): a is CompRef {
  return a instanceof Object && (a as CompRef).type === "cref";
}
