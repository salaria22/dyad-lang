import { FileEntity, unparseModuleString } from "./files.js";
import { ModuleEntity } from "./modules.js";
import { LibraryEntity } from "./libraries.js";
import { RelatedEntities } from "./entities.js";
import { FastURN, FastURNSpace } from "./fast.js";

export type DefinitionEntity = FastURN<"definition">;
const definitionSpace = new FastURNSpace("definition", (nss) => {
  const parts = nss.split(":");
  const library = parts[0];
  const modules = unparseModuleString(parts[1]);
  const definition = parts[2];
  return { library, modules, definition };
});

export function isDefinitionEntity(e: string): e is DefinitionEntity {
  return definitionSpace.is(e);
}

export function definitionEntity(
  lib: string,
  mods: string[],
  def: string
): DefinitionEntity {
  return definitionSpace.create(`${lib}:${mods.join(".")}:${def}`);
}

export function unparseDefinitionEntity(e: DefinitionEntity) {
  return definitionSpace.unparse(e);
}

export interface DefinitionEntities {
  kind: "def";
  self: DefinitionEntity;
  file: FileEntity;
  module: ModuleEntity;
  library: LibraryEntity;
}

export function definitionEntities(
  self: DefinitionEntity,
  file: FileEntity,
  module: ModuleEntity,
  library: LibraryEntity
): DefinitionEntities {
  return {
    kind: "def",
    self,
    file,
    module,
    library,
  };
}

export function isDefinitionEntities(
  x: RelatedEntities
): x is DefinitionEntities {
  return x.kind === "def";
}
