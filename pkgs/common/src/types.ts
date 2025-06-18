/** Useful parameterized types and/or conditional types */

/**
 * This is our Option type for the AST nodes.  We don't use Maybe from
 * `purify-ts` because that doesn't serialize well.  So for AST construction,
 * manipulation and (de)serialization we want to stick with pure JSON (hence
 * this type).
 */
export type Nullable<T> = T | null;

export type FirstArgument<T> = T extends (x: infer R, y: any) => any
  ? R
  : never;

export type Element<T> = T extends Array<infer E> ? E : never;
