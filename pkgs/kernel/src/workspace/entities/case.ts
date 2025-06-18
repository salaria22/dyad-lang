import { assertUnreachable } from "@juliacomputing/dyad-common";
import {
  DefinitionEntity,
  isDefinitionEntity,
  unparseDefinitionEntity,
} from "./definitions.js";
import { Entity } from "./entities.js";
import { FileEntity, isFileEntity, unparseFileEntity } from "./files.js";
import {
  isLibraryEntity,
  LibraryEntity,
  unparseLibraryEntity,
} from "./libraries.js";
import {
  isModuleEntity,
  ModuleEntity,
  unparseModuleEntity,
} from "./modules.js";
import {
  BuiltinEntity,
  isBuiltinEntity,
  unparseBuiltinEntity,
} from "./builtin.js";

export interface EntityCases<R> {
  Builtin: (name: string, entity: BuiltinEntity) => R;
  Definition: (
    library: string,
    modules: string[],
    definition: string,
    entity: DefinitionEntity
  ) => R;
  Module: (library: string, modules: string[], entity: ModuleEntity) => R;
  File: (
    library: string,
    module: string[],
    file: string,
    entity: FileEntity
  ) => R;
  Library: (library: string, entity: LibraryEntity) => R;
}

export function caseOfEntity<R>(e: Entity, cases: EntityCases<R>): R {
  if (isBuiltinEntity(e)) {
    const { name } = unparseBuiltinEntity(e);
    return cases.Builtin(name, e);
  }
  if (isDefinitionEntity(e)) {
    const { library, modules, definition } = unparseDefinitionEntity(e);
    return cases.Definition(library, modules, definition, e);
  }
  if (isFileEntity(e)) {
    const { library, modules, file } = unparseFileEntity(e);
    return cases.File(library, modules, file, e);
  }
  if (isModuleEntity(e)) {
    const { library, modules } = unparseModuleEntity(e);
    return cases.Module(library, modules, e);
  }
  if (isLibraryEntity(e)) {
    const { library } = unparseLibraryEntity(e);
    return cases.Library(library, e);
  }
  assertUnreachable(e);
}
