/**
 * This file contains operators for resolving types and symbols
 */

import {
  builtinEntity,
  BuiltinEntity,
  DefinitionEntities,
  definitionEntity,
  DefinitionEntity,
  describeEntity,
  Entity,
  isBuiltinEntity,
  isDefinitionEntity,
  libraryEntity,
  unparseModuleEntity,
} from "../entities/index.js";
import {
  builtinTypes,
  Definition,
  isParsedFile,
  DyadLibrary,
  DyadModule,
  ParsedFile,
  Token,
  WorkspaceNode,
} from "@juliacomputing/dyad-ast";
import {
  baseLibraryName,
  failedResult,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { invalidEntity } from "../entities/errors.js";
import { caseOfEntity } from "../entities/case.js";
import { Selector } from "../selector.js";
import { problemSpan } from "../utils.js";
import { CompilerAssertionError } from "../errors.js";
import { nothingProblem } from "../../result.js";
import { RelevantScopes, resolveScopes } from "./scopes.js";
import { Just, Maybe } from "purify-ts";
import { getDefinitionRelations } from "./relations.js";

/**
 * This is a workspace operator factory that creates an Observable
 * for the type symbols associated with a given entity.
 *
 * @param e The entity whose type symbols should be looked up.
 * @returns
 */
export function typeSymbols(
  node: Definition
): Selector<Result<TypesSymbolTable>> {
  return ({ query }) => {
    const rels = query(getDefinitionRelations(node));
    return query(constructSymbolTable(rels));
  };
}

/**
 * This is function that, when given an type name (in the form of tokens) in the
 * context of a definition, `context`, return a `Result` that, if successful,
 * will contain the identity of the entity that the tokens are referring to.
 *
 * @param symbol The series of tokens that constitute the type being references
 * @param context The context in which the reference exists
 * @returns An Observable of results that contain the identity of the referenced
 * entity
 */
export function lookupQualifiedType(
  symbol: Token[],
  context: Definition
): Selector<Result<DefinitionEntity | BuiltinEntity>> {
  return ({ query }) => {
    /** Extract the first part of the list of tokens */
    const firstName = symbol[0].value;

    /** Built the symbol table for this context */
    const symbols = query(typeSymbols(context));

    /**
     * Check to see if the first part of the symbol we are trying
     * to resolve exists in the symbol table.
     */
    const first = symbols.chain((symbols) =>
      lookupType(firstName, symbols).caseOf(
        nothingProblem(
          invalidEntity(
            firstName,
            `Unknown symbol ${symbol.map((x) => x.value).join(".")} in ${
              context.name.value
            }`,
            problemSpan(context, symbol[0].span)
          )
        )
      )
    );

    /**
     * Now, if there was only one symbol, just cast that to an entity and return
     * the observable directly.
     */
    if (symbol.length === 1) {
      // In this case, the values of `first` need
      // to be definition entities
      return first.chain((first) => {
        if (isDefinitionEntity(first) || isBuiltinEntity(first)) {
          return successfulResult(first);
        }
        return failedResult(
          invalidEntity(
            firstName,
            `Expected ${firstName} to be a definition but found it was a ${context.name.value}`,
            problemSpan(context, symbol[0].span)
          )
        );
      });
    }
    /**
     * If there are more symbols, resolve the identity of the child entity
     * relative to the already identified parent.
     **/
    return first.chain((e) => traverseEntity(e, symbol.slice(1)));
  };
}

interface TypesSymbolTable {
  builtins: Record<string, BuiltinEntity>;
  local: Record<string, Entity>;
  base: Record<string, Entity>;
}

function lookupType(symbol: string, table: TypesSymbolTable): Maybe<Entity> {
  const builtin = table.builtins[symbol];
  if (builtin !== undefined) {
    return Just(builtin);
  }
  const local = table.local[symbol];
  if (local !== undefined) {
    return Just(local);
  }
  return Maybe.fromNullable(table.base[symbol]);
}

/**
 * This function takes in an entity and the path to a "child" of that entity
 * and returns a `Result` that contains the identity of the resulting
 * `Entity`.
 *
 * @param e "Parent" entity
 * @param rest Path to child
 * @returns Entity (fully qualified identity) for child
 */
function traverseEntity(e: Entity, rest: Token[]): Result<DefinitionEntity> {
  return caseOfEntity(e, {
    Builtin: (): Result<DefinitionEntity> =>
      failedResult(
        new CompilerAssertionError(
          e,
          `Looking for nested name ${
            rest[0].value
          } is not allowed inside of ${describeEntity(e)}`
        )
      ),
    Definition: () =>
      failedResult(
        new CompilerAssertionError(
          e,
          `Looking for nested name ${
            rest[0].value
          } is not allowed inside of ${describeEntity(e)}`
        )
      ),
    Library: (library) =>
      successfulResult(
        definitionEntity(
          library,
          rest.slice(0, -1).map((x) => x.value),
          rest.at(-1)?.value ?? "???"
        )
      ),
    Module: (library, modules) =>
      successfulResult(
        definitionEntity(
          library,
          [...modules, ...rest.slice(0, -1).map((x) => x.value)],
          rest.at(-1)?.value ?? "???"
        )
      ),
    File: () =>
      failedResult(
        new CompilerAssertionError(
          e,
          `Looking for nested name ${
            rest[0].value
          } is not allowed inside of ${describeEntity(e)}`
        )
      ),
  });
}

/**
 * This is a `WorkspaceOperator` that constructs the symbol table for
 * a given definition entity.
 *
 * @param e The given definition entity and its related entities.
 * @returns
 */
function constructSymbolTable(
  e: DefinitionEntities
): Selector<Result<TypesSymbolTable>> {
  return ({ query }) => {
    const scopes = query(resolveScopes(e));
    /** Get the library and module that this entity is in */
    const { library, modules } = unparseModuleEntity(e.module);

    return scopes.map((r) => buildLocalTypes(r, library, modules));
  };
}
const symbolCache = new WeakMap<object, Record<string, Entity>>();

/** Calculate the builtin symbols exactly once */
const builtinSymbols = addBuitins();

function buildLocalTypes(
  r: RelevantScopes,
  library: string,
  modules: string[]
) {
  const builtins = builtinSymbols;
  const base = addBase(r.base);
  const local: Record<string, Entity> = {};

  addLibraries(r.root, local);
  addModule(r.mod, library, modules, local);
  addImports(r.file, local);

  return { builtins, local, base };
}

function addLibraries(root: WorkspaceNode, table: Record<string, Entity>) {
  for (const lib of root.libraries) {
    table[lib.name] = libraryEntity(lib.name);
  }
}

function addModule(
  mod: DyadModule,
  library: string,
  modules: string[],
  table: Record<string, Entity>
) {
  for (const file of mod.files) {
    if (isParsedFile(file)) {
      for (const def of file.definitions) {
        table[def.name.value] = definitionEntity(
          library,
          modules,
          def.name.value
        );
      }
    }
  }
}

function addImports(file: ParsedFile, ret: Record<string, Entity>) {
  for (const using of file.uses) {
    /**
     * I'm reconsidering wildcard imports because we can do them for Dyad
     * libraries, but not Julia packages which seems inconsistent
     **/
    if (using.symbols.length === 0) {
      console.warn("Ignoring wildcard imports");
    } else {
      const parts = using.module.value.split(".");
      const lib = parts[0];
      const mods = parts.slice(1);
      /** Check to see if any of the imported symbols match the symbol we are looking for */
      for (const sym of using.symbols) {
        ret[sym.symbol.value] = definitionEntity(lib, mods, sym.symbol.value);
      }
    }
  }
}

function addBase(base: DyadLibrary) {
  // Check if we have a cached copy already.  Since `base` doesn't change for a given
  // workspace, this just avoids extra work.
  const cached = symbolCache.get(base);
  if (cached !== undefined) {
    return cached;
  }
  const ret: Record<string, DefinitionEntity> = {};

  for (const file of base.rootModule.files) {
    if (isParsedFile(file)) {
      for (const def of file.definitions) {
        ret[def.name.value] = definitionEntity(
          baseLibraryName,
          [],
          def.name.value
        );
      }
    }
  }

  symbolCache.set(base, ret);
  return ret;
}

function addBuitins() {
  const ret: Record<string, BuiltinEntity> = {};
  for (const entry of builtinTypes) {
    const name = entry.name[0].value;
    ret[name] = builtinEntity(name);
  }
  return ret;
}
