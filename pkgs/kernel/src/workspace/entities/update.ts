import { isParsedFile } from "@juliacomputing/dyad-ast";
import { Entity, EntityNode, RelatedEntities } from "./entities.js";
import {
  libraryEntities,
  LibraryEntities,
  libraryEntity,
} from "./libraries.js";
import { queryLibraries } from "../selectors/libraries.js";
import { queryAllModules } from "../selectors/index.js";
import { castOrThrow } from "../../flow.js";
import { Maybe } from "purify-ts/Maybe";
import { CompilerAssertionError } from "../errors.js";
import { moduleEntities, moduleEntity } from "./modules.js";
import { fileEntities, fileEntity } from "./files.js";
import { definitionEntities, definitionEntity } from "./definitions.js";
import { QueryHandler } from "../selector.js";

/** Walk the tree and record information about parents in a weakmap. */
export function updateEntityRelations(
  query: QueryHandler,
  record: (node: EntityNode, val: RelatedEntities) => void
) {
  const lmap = new Map<string, LibraryEntities>();
  const libs = query(queryLibraries);
  for (const [lname, lib] of Object.entries(libs)) {
    const entities = libraryEntities(libraryEntity(lname), []);
    lmap.set(lname, entities);
    record(lib, entities);
  }
  const mods = query(queryAllModules);
  mods.forEach((mod, key) => {
    const parts = key.split(".");
    const libname = parts[0];
    const ms = parts.slice(1);
    const lib = castOrThrow(
      Maybe.fromNullable(lmap.get(libname)),
      new CompilerAssertionError(
        "updateEntities",
        "updateEntities found module without parent library!"
      )
    );
    const mself = moduleEntity(libname, ms);
    const mentities = moduleEntities(mself, lib.self, []);
    record(mod, mentities);
    for (const file of mod.files) {
      const fself = fileEntity(libname, ms, file.source.file);
      const fentities = fileEntities(fself, lib.self, mself, []);
      record(file, fentities);
      if (isParsedFile(file)) {
        for (const def of Object.values(file.definitions)) {
          const dself = definitionEntity(libname, ms, def.name.value);
          const dentities = definitionEntities(dself, fself, mself, lib.self);
          record(def, dentities);
        }
      }
    }
  });
}

export interface EntityRelationMaps {
  relationsMap: Map<Entity, RelatedEntities>;
  nodeMap: Map<Entity, EntityNode>;
}

/** Walk the tree and record information about parents in a weakmap. */
export function generateEntityRelationsMap(
  query: QueryHandler
): EntityRelationMaps {
  const relationsMap = new Map<Entity, RelatedEntities>();
  const nodeMap = new Map<Entity, EntityNode>();
  const lmap = new Map<string, LibraryEntities>();
  const libs = query(queryLibraries);
  for (const [lname, lib] of Object.entries(libs)) {
    const self = libraryEntity(lname);
    const entities = libraryEntities(self, []);
    lmap.set(lname, entities);
    relationsMap.set(self, entities);
    nodeMap.set(self, lib);
  }
  const mods = query(queryAllModules);
  mods.forEach((mod, key) => {
    const parts = key.split(".");
    const libname = parts[0];
    const ms = parts.slice(1);
    const lib = castOrThrow(
      Maybe.fromNullable(lmap.get(libname)),
      new CompilerAssertionError(
        "updateEntities",
        "updateEntities found module without parent library!"
      )
    );
    const mself = moduleEntity(libname, ms);
    const mentities = moduleEntities(mself, lib.self, []);
    relationsMap.set(mself, mentities);
    nodeMap.set(mself, mod);
    for (const file of mod.files) {
      const fself = fileEntity(libname, ms, file.source.file);
      const fentities = fileEntities(fself, lib.self, mself, []);
      relationsMap.set(fself, fentities);
      nodeMap.set(fself, file);
      if (isParsedFile(file)) {
        for (const def of Object.values(file.definitions)) {
          const dself = definitionEntity(libname, ms, def.name.value);
          const dentities = definitionEntities(dself, fself, mself, lib.self);
          relationsMap.set(dself, dentities);
          nodeMap.set(dself, def);
        }
      }
    }
  });
  return { relationsMap, nodeMap };
}
