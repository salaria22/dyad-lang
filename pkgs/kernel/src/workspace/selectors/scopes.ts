import {
  baseLibraryName,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { DefinitionEntities, libraryEntity } from "../entities/index.js";
import { Selector } from "../selector.js";
import {
  isParsedFile,
  DyadLibrary,
  DyadModule,
  ParsedFile,
  WorkspaceNode,
} from "@juliacomputing/dyad-ast";
import { getFileNode, getLibraryNode, getModuleNode } from "./nodes.js";

export interface RelevantScopes {
  root: WorkspaceNode;
  file: ParsedFile;
  mod: DyadModule;
  base: DyadLibrary;
}

export function resolveScopes(
  e: DefinitionEntities
): Selector<Result<RelevantScopes>> {
  return ({ root, query }) => {
    /** Get observables for all the different scopes */
    const base = query(getLibraryNode(libraryEntity(baseLibraryName)));
    const mod = query(getModuleNode(e.module));
    const file = query(getFileNode(e.file, isParsedFile));

    return Result.combine({
      root: successfulResult(root),
      base,
      mod,
      file,
    });
  };
}
