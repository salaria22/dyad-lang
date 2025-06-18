import { LibraryEntity } from "./libraries.js";
import { DefinitionEntity } from "./definitions.js";
import { unparseModuleString } from "./files.js";
import { FastURN, FastURNSpace } from "./fast.js";

const moduleSpace = new FastURNSpace("module", (nss) => {
  const parts = nss.split(":");
  const library = parts[0];
  const modules = unparseModuleString(parts[1]);
  return { library, modules };
});
export type ModuleEntity = FastURN<"module">;

export function isModuleEntity(e: string): e is ModuleEntity {
  return moduleSpace.is(e);
}

export function moduleEntity(lib: string, mods: string[]): ModuleEntity {
  return moduleSpace.create(`${lib}:${mods.join(".")}`);
}

export function unparseModuleEntity(e: ModuleEntity) {
  return moduleSpace.unparse(e);
}

export interface ModuleEntities {
  kind: "mod";
  self: ModuleEntity;
  library: LibraryEntity;
  definitions: DefinitionEntity[];
}

export function moduleEntities(
  self: ModuleEntity,
  library: LibraryEntity,
  definitions: DefinitionEntity[]
): ModuleEntities {
  return {
    kind: "mod",
    self,
    library,
    definitions,
  };
}
