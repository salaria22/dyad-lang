import { FileEntities, FileEntity, isFileEntity } from "./files.js";
import {
  isLibraryEntity,
  LibraryEntities,
  LibraryEntity,
} from "./libraries.js";
import { isModuleEntity, ModuleEntities, ModuleEntity } from "./modules.js";
import {
  DefinitionEntities,
  DefinitionEntity,
  isDefinitionEntity,
} from "./definitions.js";
import {
  Definition,
  FileContents,
  isFileContents,
  DyadLibrary,
  DyadModule,
  ParsedFile,
  RawFile,
} from "@juliacomputing/dyad-ast";
import { BuiltinEntity, isBuiltinEntity } from "./builtin.js";
import { caseOfEntity } from "./case.js";
import { Result } from "@juliacomputing/dyad-common";
import { Selector } from "../selector.js";
import { unexpectedValue } from "../../instantiate/errors.js";
import {
  getDefinitionNode,
  getFileNode,
  getLibraryNode,
  getModuleNode,
} from "../selectors/nodes.js";

/** The union of all entity types */
export type Entity =
  | LibraryEntity
  | ModuleEntity
  | FileEntity
  | DefinitionEntity
  | BuiltinEntity;

export type TypeEntity = DefinitionEntity | BuiltinEntity;

export function isTypeEntity(e: Entity): e is TypeEntity {
  return isDefinitionEntity(e) || isBuiltinEntity(e);
}

export type RelatedEntities =
  | LibraryEntities
  | ModuleEntities
  | FileEntities
  | DefinitionEntities;

export type EntityNode = Definition | FileContents | DyadModule | DyadLibrary;

export type NodeTypeOfEntity<E extends Entity> = E extends DefinitionEntity
  ? Definition
  : E extends FileEntity
    ? ParsedFile | RawFile
    : E extends LibraryEntity
      ? DyadLibrary
      : E extends ModuleEntity
        ? DyadModule
        : never;

export type EntityTypeOfNode<E extends EntityNode> = E extends Definition
  ? DefinitionEntity
  : E extends ParsedFile | RawFile
    ? FileEntity
    : E extends DyadLibrary
      ? LibraryEntity
      : E extends DyadModule
        ? ModuleEntity
        : never;

export function describeEntity(e: Entity): string {
  return caseOfEntity(e, {
    Builtin: (name) => `builtin ${name}`,
    Definition: (library, modules, definition) =>
      `definition ${definition} in ${[library, ...modules].join(".")}`,
    File: (library, modules, file) =>
      `file ${file} in ${[library, ...modules].join(".")}`,
    Module: (library, modules) => `module ${[library, ...modules].join(".")}`,
    Library: (library) => `library ${library}`,
  });
}

export function entitySelector(e: Entity): Selector<Result<EntityNode>> {
  if (isDefinitionEntity(e)) {
    return getDefinitionNode(e);
  } else if (isModuleEntity(e)) {
    return getModuleNode(e);
  } else if (isLibraryEntity(e)) {
    return getLibraryNode(e);
  } else if (isFileEntity(e)) {
    return getFileNode(e, isFileContents);
  } else {
    throw unexpectedValue(e, `Requested node for ${describeEntity(e)}`, {
      file: null,
      span: null,
    });
  }
}
