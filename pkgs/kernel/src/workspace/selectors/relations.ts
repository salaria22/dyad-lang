import {
  Definition,
  FileContents,
  DyadLibrary,
  DyadModule,
} from "@juliacomputing/dyad-ast";
import { DefinitionEntities } from "../entities/definitions.js";
import { FileEntities } from "../entities/files.js";
import { LibraryEntities } from "../entities/libraries.js";
import { ModuleEntities } from "../entities/modules.js";
import { CompilerAssertionError } from "../errors.js";
import { Selector } from "../selector.js";

/**
 * Find entities related to a library
 *
 * @param entity A library entity
 * @returns Entities related to this library
 */
export function getLibraryRelations(
  entity: DyadLibrary
): Selector<LibraryEntities> {
  return ({ attrs }) => {
    const ret = attrs.getRelations(entity);
    if (ret.kind !== "lib") {
      throw new CompilerAssertionError(
        "getLibraryRelations",
        `Library node had ${ret.kind} relation mapping`
      );
    }
    return ret;
  };
}
/**
 * Find entities related to a module
 *
 * @param entity A module entity
 * @returns Entities related to this module
 */
export function getModuleRelations(
  entity: DyadModule
): Selector<ModuleEntities> {
  return ({ attrs }) => {
    const ret = attrs.getRelations(entity);
    if (ret.kind !== "mod") {
      throw new CompilerAssertionError(
        "getModuleRelations",
        `Module node had ${ret.kind} relation mapping`
      );
    }
    return ret;
  };
}
/**
 * Find entities related to a file
 *
 * @param entity A file entity
 * @returns Entities related to this file
 */
export function getFileRelations(entity: FileContents): Selector<FileEntities> {
  return ({ attrs }) => {
    const ret = attrs.getRelations(entity);
    if (ret.kind !== "file") {
      throw new CompilerAssertionError(
        "getFileRelations",
        `File node had ${ret.kind} relation mapping`
      );
    }
    return ret;
  };
}

/**
 * Find entities related to a definition
 *
 * @param entity A definition entity
 * @returns Entities related to this definition
 */
export function getDefinitionRelations(
  entity: Definition
): Selector<DefinitionEntities> {
  return ({ attrs }) => {
    const ret = attrs.getRelations(entity);
    if (ret.kind !== "def") {
      throw new CompilerAssertionError(
        "getDefinitionRelations",
        `Definition node had ${ret.kind} relation mapping`
      );
    }
    return ret;
  };
}
