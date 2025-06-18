import {
  Definition,
  FileContents,
  DyadLibrary,
  DyadModule,
} from "@juliacomputing/dyad-ast";
import { EntityNode, Entity } from "../entities/entities.js";
import { CompilerAssertionError } from "../errors.js";
import { Selector } from "../selector.js";
import { DefinitionEntity } from "../entities/definitions.js";
import { FileEntity } from "../entities/files.js";
import { ModuleEntity } from "../entities/modules.js";
import { LibraryEntity } from "../entities/libraries.js";

/**
 * Get the `Entity` associated with the provided `EntityNode`
 *
 * @param node
 * @returns
 */
export function getEntity(node: EntityNode): Selector<Entity> {
  return ({ attrs }) => attrs.getRelations(node).self;
}

/**
 * Get the `DefinitionEntity` associated with the provided `Definition` node
 * @param node Definition node
 * @returns DefinitionEntity
 */
export function getDefinitionEntity(
  node: Definition
): Selector<DefinitionEntity> {
  return ({ attrs }) => {
    const rels = attrs.getRelations(node);
    if (rels.kind !== "def") {
      throw new CompilerAssertionError(
        "getDefinitionEntity",
        `Expected definition relations but got ${rels.kind}`
      );
    }
    return rels.self;
  };
}

/**
 * Get the `FileEntity` associated with the provided `FileContents` node
 * @param node File node
 * @returns FileEntity
 */
export function getFileEntity(node: FileContents): Selector<FileEntity> {
  return ({ attrs }) => {
    const rels = attrs.getRelations(node);
    if (rels.kind !== "file") {
      throw new CompilerAssertionError(
        "getFileEntity",
        `Expected file relations but got ${rels.kind}`
      );
    }
    return rels.self;
  };
}

/**
 * Get the `ModuleEntity` associated with the provided `DyadModule` node
 * @param node DyadModule node
 * @returns ModuleEntity
 */
export function getModuleEntity(node: DyadModule): Selector<ModuleEntity> {
  return ({ attrs }) => {
    const rels = attrs.getRelations(node);
    if (rels.kind !== "mod") {
      throw new CompilerAssertionError(
        "getModuleEntity",
        `Expected module relations but got ${rels.kind}`
      );
    }
    return rels.self;
  };
}

/**
 * Get the `LibraryEntity` associated with the provided `DyadLibrary` node
 * @param node DyadLibrary node
 * @returns LibraryEntity
 */
export function getLibraryEntity(node: DyadLibrary): Selector<LibraryEntity> {
  return ({ attrs }) => {
    const rels = attrs.getRelations(node);
    if (rels.kind !== "lib") {
      throw new CompilerAssertionError(
        "getLibraryEntity",
        `Expected library relations but got ${rels.kind}`
      );
    }
    return rels.self;
  };
}
