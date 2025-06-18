import type { IToken } from "chevrotain";

export interface GenericCstNode {
  name: string;
  children: GenericCstChildren;
}

export type GenericCstChildren = {
  [identifier: string]: GenericCstNode[] | IToken[];
};

export type NodeChildType<
  T extends GenericCstNode,
  K extends keyof T["children"]
> = T["children"][K];

export type ChildType<T extends GenericCstChildren, K extends keyof T> = T[K];

export type ArrayElement<T> = T extends Array<infer R> ? R : never;

export function mapSingleton<
  T extends GenericCstChildren,
  K extends keyof T,
  R
>(node: T, child: K, f: (x: ArrayElement<ChildType<T, K>>) => R): R {
  const arr = node[child];
  if (arr === undefined) {
    throw new Error(
      `Expected field ${child as string} to be present, but it wasn't`
    );
  }
  if (Array.isArray(arr)) {
    if (arr.length !== 1) {
      throw new Error(
        `Expected ${
          child as string
        } to be an array with one element, but it had ${arr.length}`
      );
    }
    const elem: ArrayElement<ChildType<T, K>> = arr[0] as any;
    return f(elem);
  } else {
    throw new Error(
      `Expected ${child as string} to be an array, but it wasn't`
    );
  }
}

export function mapArray<T extends GenericCstChildren, K extends keyof T, R>(
  node: T,
  child: K,
  f: (x: ArrayElement<ChildType<T, K>>) => R
): R[] {
  const arr = node[child];
  if (arr === undefined) {
    return [];
  }
  if (Array.isArray(arr)) {
    const elems: Array<ArrayElement<ChildType<T, K>>> = arr as any;
    return elems.map(f);
  } else {
    throw new Error(
      `Expected ${child as string} to be an array, but it wasn't`
    );
  }
}

export function mapOptional<T extends GenericCstChildren, K extends keyof T, R>(
  node: T,
  child: K,
  f: (x: ArrayElement<ChildType<T, K>>) => R
): R | null {
  const arr = node[child];
  if (arr === undefined) {
    return null;
  }
  if (Array.isArray(arr)) {
    if (arr.length !== 1) {
      throw new Error(
        `Expected ${
          child as string
        } to be an array with one element, but it had ${arr.length}`
      );
    }

    const elem: ArrayElement<ChildType<T, K>> = arr[0] as any;
    return f(elem);
  } else {
    throw new Error(
      `Expected ${child as string} to be an array, but it wasn't`
    );
  }
}
