import { isParsedFile } from "@juliacomputing/dyad-ast";
import {
  definitionEntities,
  definitionEntity,
  Entity,
  EntityNode,
  fileEntities,
  fileEntity,
  libraryEntities,
  LibraryEntities,
  libraryEntity,
  moduleEntities,
  moduleEntity,
  RelatedEntities,
} from "../entities/index.js";
import { QueryHandler } from "../selector.js";
import { queryLibraries } from "../selectors/libraries.js";
import { queryAllModules } from "../selectors/modules.js";
import { castOrThrow } from "../../flow.js";
import { Maybe } from "purify-ts";
import { CompilerAssertionError } from "../errors.js";

export interface EntityMappings {
  nodeRelations: WeakMap<EntityNode, RelatedEntities>;
  nodes: Map<Entity, EntityNode>;
  entities: Map<Entity, RelatedEntities>;
  libraries: Map<string, LibraryEntities>;
}

/**
 * This function walks the WorkspaceNode tree and records various useful
 * mappings.
 *
 * @param root The root of the Workspace
 * @returns Various useful mappings
 */
export const entityMap = (query: QueryHandler): EntityMappings => {
  const nodeRelations = new WeakMap<EntityNode, RelatedEntities>();
  const nodes = new Map<Entity, EntityNode>();
  const entities = new Map<Entity, RelatedEntities>();
  const libraries = new Map<string, LibraryEntities>();
  const libs = query(queryLibraries);
  for (const [lname, lib] of Object.entries(libs)) {
    const lentities = libraryEntities(libraryEntity(lname), []);
    libraries.set(lname, lentities);
    nodeRelations.set(lib, lentities);
    entities.set(lentities.self, lentities);
    nodes.set(lentities.self, lib);
  }
  const mods = query(queryAllModules);
  mods.forEach((mod, key) => {
    const parts = key.split(".");
    const libname = parts[0];
    const ms = parts.slice(1);
    const lib = castOrThrow(
      Maybe.fromNullable(libraries.get(libname)),
      new CompilerAssertionError(
        "updateEntities",
        "updateEntities found module without parent library!"
      )
    );
    const mself = moduleEntity(libname, ms);
    const mentities = moduleEntities(mself, lib.self, []);
    nodeRelations.set(mod, mentities);
    entities.set(mentities.self, mentities);
    nodes.set(mself, mod);
    for (const file of mod.files) {
      const fself = fileEntity(libname, ms, file.source.file);
      const fentities = fileEntities(fself, lib.self, mself, []);
      nodeRelations.set(file, fentities);
      entities.set(fentities.self, fentities);
      nodes.set(fself, file);
      if (isParsedFile(file)) {
        for (const def of Object.values(file.definitions)) {
          const dself = definitionEntity(libname, ms, def.name.value);
          const dentities = definitionEntities(dself, fself, mself, lib.self);
          nodeRelations.set(def, dentities);
          entities.set(dentities.self, dentities);
          nodes.set(dself, def);
        }
      }
    }
  });
  return { nodeRelations, nodes, entities, libraries };
};
