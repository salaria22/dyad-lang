import { Maybe, Nothing } from "purify-ts/Maybe";
import { findModule, DyadLibrary, DyadModule } from "@juliacomputing/dyad-ast";
import { Selector } from "../selector.js";

export function queryModule(
  libraryName: string,
  module: string[]
): Selector<Maybe<DyadModule>> {
  return ({ root }) => {
    for (const lib of root.libraries) {
      if (lib.name === libraryName) {
        return Maybe.fromNullable(findModule(lib, module));
      }
    }
    return Nothing;
  };
}

export function queryModuleByUUID(
  libraryUUID: string,
  module: string[]
): Selector<Maybe<DyadModule>> {
  return ({ root }) => {
    for (const lib of root.libraries) {
      if (lib.uuid === libraryUUID) {
        return Maybe.fromNullable(findModule(lib, module));
      }
    }
    return Nothing;
  };
}

/**
 * Find all modules contained in the current workspace.  They are indexed by their
 * fully qualified names.
 */
export const queryAllModules: Selector<Map<string, DyadModule>> = ({
  root,
}): Map<string, DyadModule> => {
  const ret = new Map<string, DyadModule>();
  for (const library of root.libraries) {
    const mmap = listAllModules(library);
    for (const [key, val] of mmap.entries()) {
      ret.set(key, val);
    }
  }
  return ret;
};

export function listAllModules(lib: DyadLibrary): Map<string, DyadModule> {
  const ret = new Map<string, DyadModule>();
  function recordModule(modname: string, mod: DyadModule) {
    ret.set(modname, mod);
    for (const [cname, cmod] of Object.entries(mod.submodules)) {
      recordModule(`${modname}.${cname}`, cmod);
    }
  }
  recordModule(lib.name, lib.rootModule);
  return ret;
}
