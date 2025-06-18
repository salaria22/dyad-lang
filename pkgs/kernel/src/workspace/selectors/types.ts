import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { isParsedFile, Definition, findModule } from "@juliacomputing/dyad-ast";
import { Selector } from "../selector.js";
import { queryLibrary } from "./libraries.js";
import { queryAllModules } from "./modules.js";

/** Find a particular definition within a specific library and module */
export function queryType(
  lib: string,
  module: string[],
  name: string
): Selector<Maybe<Definition>> {
  return ({ query }) => {
    const library = query(queryLibrary(lib));
    return library.chain((l) => {
      const mod = findModule(l, module);
      if (mod) {
        for (const file of mod.files) {
          if (isParsedFile(file)) {
            for (const def of file.definitions) {
              if (def.name.value === name) {
                return Just(def);
              }
            }
          }
        }
      }
      return Nothing;
    });
  };
}

export interface DefinitionDetails {
  node: Definition;
  /** Two definitions are _semantically_ the same if this hash matches */
  semanticHash: string;
  /** Two definitions have identical string representations if this hash matches */
  contentHash: string;
}

export const queryDefinitionMap: Selector<Map<string, DefinitionDetails>> = (
  res
): Map<string, DefinitionDetails> => {
  const ret = new Map<string, DefinitionDetails>();
  const modules = queryAllModules(res);
  modules.forEach((mod, modname) => {
    for (const file of mod.files) {
      if (isParsedFile(file)) {
        for (const def of file.definitions) {
          ret.set(`${modname}.${def.name.value}`, {
            node: def,
            semanticHash: "",
            contentHash: "",
          });
        }
      }
    }
  });
  return ret;
};
