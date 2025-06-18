import { ASTNode } from "./node.js";
import { FileContents } from "./file.js";
import { Children, childArray, childObject } from "./children.js";

/**
 * Node used to represent Dyad modules
 *
 * @category AST Nodes
 **/
export interface DyadModule {
  kind: "module";
  /** Set of submodules associated with this module */
  submodules: Record<string, DyadModule>;

  /** List of Dyad source files contained in this module */
  files: FileContents[];
}

/**
 * List the children of a `DyadModule` node
 *
 * @category Navigation
 * @param mod
 * @returns
 */
export function DyadModuleChildren(mod: DyadModule): Children {
  const subs = childObject("submodules", mod);
  const files = childArray("files", mod);
  return { ...subs, ...files };
}

/**
 * Determine if a given `ASTNode` is an instance of `DyadModule`
 *
 * @category Type Predicates
 * @param node
 * @returns
 */
export function isDyadModule(node: ASTNode | null): node is DyadModule {
  return node !== null && node.kind === "module";
}

/**
 * Information known about a library that was authored using Dyad
 *
 * @category AST Nodes
 **/
export interface DyadLibrary {
  kind: "lib";
  /** Name of the library (should match what is in `Project.toml`) */
  name: string;

  /** The UUID of the library */
  uuid: string;

  /** This is the root module of this library. */
  rootModule: DyadModule;

  // TODO: Include module local functions that have been somehow registered.
  // functions: FunctionRegistration[];
}

/**
 * List the children of a `DyadLibrary` node
 *
 * @category Navigation
 * @param lib
 * @returns
 */
export function DyadLibraryChildren(lib: DyadLibrary): Children {
  return { rootModule: lib.rootModule };
}

/** Predicate indicating whether a given `ASTNode` is an instance of `DyadLibrary`
 *
 * @category Type Predicates
 **/
export function isDyadLibrary(x: ASTNode | null): x is DyadLibrary {
  return x !== null && x.kind === "lib";
}

/**
 * Construct an instance of `DyadLibrary`
 *
 * @category AST Nodes
 * @param name
 * @param uuid
 * @param rootModule
 * @returns
 */
export function dyadLibrary(
  name: string,
  uuid: string,
  rootModule?: DyadModule
): DyadLibrary {
  return {
    kind: "lib",
    name,
    uuid,
    rootModule: rootModule ?? {
      kind: "module",
      submodules: {},
      files: [],
    },
  };
}

/**
 * Find the specified `DyadModule` node given the Dyad library name and the module name
 *
 * @category Navigation
 *
 * @param lib
 * @param mod
 * @returns
 */
export function findModule(lib: DyadLibrary, mod: string[]): DyadModule | null {
  let cur = lib.rootModule;
  for (const m of mod) {
    const sub = cur.submodules[m];
    if (sub === undefined) {
      return null;
    }
    cur = sub;
  }
  return cur;
}

/**
 * Add a module to a given library in the abstract syntax tree.  If the module
 * already exists, the existing module is returned.  Otherwise, the new module
 * is returned.
 *
 * @category Navigation
 *
 * @param lib The library to add the submodule to
 * @param mod The module to add
 * @param createParent Create parents if necessary.  If this is false, `null` will be returned if one or more of the parent modules don't exist
 * @returns The module to be created
 */
export function addModule(
  lib: DyadLibrary,
  mod: string[],
  createParent: boolean
): DyadModule | null {
  /** If they are trying to add the rootModule, just return the existing one. */
  if (mod.length === 0) {
    return lib.rootModule;
  }

  const parentModule = mod.slice(0, -1);
  /** Find the parent module for the module being added */
  let parent = findModule(lib, parentModule);
  /** If it doesn't exist, create it if requested, otherwise return null */
  if (parent === null) {
    if (createParent) {
      parent = addModule(lib, parentModule, createParent);
    }
  }
  /** If, for whatever reason, we couldn't find/add the parent, we return null */
  if (parent === null) {
    return null;
  }
  const last = mod[mod.length - 1];
  const existing = parent.submodules[last];
  if (existing) {
    return existing;
  }
  const ret: DyadModule = {
    kind: "module",
    submodules: {},
    files: [],
  };
  parent.submodules[last] = ret;
  return ret;
}
