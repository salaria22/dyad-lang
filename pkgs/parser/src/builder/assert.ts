import { IToken } from "chevrotain";
import { Nullable } from "@juliacomputing/dyad-common";

export function assertRecord<V>(arr: Array<[string, V]>, duplicates: string[]) {
  const used = new Set<string>();
  for (const [key, _] of arr) {
    if (used.has(key)) {
      duplicates.push(key);
    } else {
      used.add(key);
    }
  }
  return Object.fromEntries(arr);
}

export function assertUnique<T>(arr: T[], id: (x: T) => string): string[] {
  const duplicates: string[] = [];
  const used = new Set<string>();
  for (const x of arr) {
    const xid = id(x);
    if (used.has(xid)) {
      duplicates.push(xid);
    } else {
      used.add(xid);
    }
  }
  return duplicates;
}
