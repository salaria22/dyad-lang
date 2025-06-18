import { DyadLibrary } from "@juliacomputing/dyad-ast";
import { Selector } from "../selector.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";

/**
 * Get all libraries in the `Workspace`
 * @returns
 */
export const queryLibraries: Selector<Record<string, DyadLibrary>> = ({
  root,
}) => {
  const ret: Record<string, DyadLibrary> = {};
  for (const lib of root.libraries) {
    ret[lib.name] = lib;
  }
  return ret;
};

export function queryLibrary(name: string): Selector<Maybe<DyadLibrary>> {
  return ({ root }) => {
    for (const lib of root.libraries) {
      if (lib.name === name) {
        return Just(lib);
      }
    }
    return Nothing;
  };
}
