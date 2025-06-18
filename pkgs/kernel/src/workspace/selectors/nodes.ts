import {
  ASTNode,
  Definition,
  FileContents,
  isDefinition,
  isFileContents,
  isDyadLibrary,
  isDyadModule,
  DyadLibrary,
  DyadModule,
} from "@juliacomputing/dyad-ast";
import { Result } from "@juliacomputing/dyad-common";
import { nothingProblem } from "../../result.js";
import { DefinitionEntity } from "../entities/definitions.js";
import { describeEntity } from "../entities/entities.js";
import { unknownEntity } from "../entities/errors.js";
import { Selector } from "../selector.js";
import { LibraryEntity } from "../entities/libraries.js";
import { ModuleEntity } from "../entities/modules.js";
import { FileEntity } from "../entities/files.js";

/**
 * Get the definition node associated with a given entity, assuming one exists.
 *
 * @param entity
 * @returns
 */
export function getDefinitionNode(
  entity: DefinitionEntity
): Selector<Result<Definition>> {
  return ({ attrs }) => {
    return attrs
      .getEntityNode(entity)
      .caseOf(
        nothingProblem(
          unknownEntity(entity, `Unknown entity ${describeEntity(entity)}`)
        )
      )
      .filter(isDefinition, (v) =>
        unknownEntity(entity, `Expected a definition, got a ${v.kind}`)
      );
  };
}

/**
 * Get the Dyad library node associated with a given entity, assuming one exists.
 *
 * @param entity
 * @returns
 */
export function getLibraryNode(
  entity: LibraryEntity
): Selector<Result<DyadLibrary>> {
  return ({ attrs }) => {
    return attrs
      .getEntityNode(entity)
      .caseOf(
        nothingProblem(
          unknownEntity(entity, `Unknown entity ${describeEntity(entity)}`)
        )
      )
      .filter(isDyadLibrary, (v) =>
        unknownEntity(entity, `Expected a library, got a ${v.kind}`)
      );
  };
}

/**
 * Get the Dyad module node associated with a given entity, assuming one exists.
 *
 * @param entity
 * @returns
 */
export function getModuleNode(
  entity: ModuleEntity
): Selector<Result<DyadModule>> {
  return ({ attrs }) => {
    return attrs
      .getEntityNode(entity)
      .caseOf(
        nothingProblem(
          unknownEntity(entity, `Unknown entity ${describeEntity(entity)}`)
        )
      )
      .filter(isDyadModule, (v) =>
        unknownEntity(entity, `Expected a module, got a ${v.kind}`)
      );
  };
}

/**
 * Get the Dyad module node associated with a given entity, assuming one exists.
 *
 * @param entity
 * @returns
 */
export function getFileNode<T extends FileContents>(
  entity: FileEntity,
  pred: (x: FileContents) => x is T
): Selector<Result<T>> {
  const fpred = (x: ASTNode): x is T => isFileContents(x) && pred(x);
  return ({ attrs }) => {
    return attrs
      .getEntityNode(entity)
      .caseOf(
        nothingProblem(
          unknownEntity(entity, `Unknown entity ${describeEntity(entity)}`)
        )
      )
      .filter(fpred, (v) =>
        unknownEntity(entity, `Expected a file, got a ${v.kind}`)
      );
  };
}
