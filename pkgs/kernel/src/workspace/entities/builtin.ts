import { builtinTypes, QualifiedType } from "@juliacomputing/dyad-ast";
import { Maybe } from "purify-ts";
import { FastURN, FastURNSpace } from "./fast.js";

const builtinSpace = new FastURNSpace("builtin", (name) => ({ name }));

export type BuiltinEntity = FastURN<"builtin">;

export function isBuiltinEntity(e: string): e is BuiltinEntity {
  return builtinSpace.is(e);
}

export function builtinEntity(name: string): BuiltinEntity {
  return builtinSpace.create(name);
}

export function unparseBuiltinEntity(e: BuiltinEntity) {
  return builtinSpace.unparse(e);
}

export function builtinEntitySelector(e: BuiltinEntity): Maybe<QualifiedType> {
  const { name } = unparseBuiltinEntity(e);
  const qtype = builtinTypes.find((x) => x.name[0].value === name);
  return Maybe.fromNullable(qtype);
}
