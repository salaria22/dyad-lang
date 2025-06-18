import { FastURN, FastURNSpace } from "./fast.js";
import { ModuleEntity } from "./modules.js";

const librarySpace = new FastURNSpace("library", (library) => ({ library }));
export type LibraryEntity = FastURN<"library">;

export function isLibraryEntity(e: string): e is LibraryEntity {
  return librarySpace.is(e);
}

export function libraryEntity(lib: string): LibraryEntity {
  return librarySpace.create(lib);
}

export function unparseLibraryEntity(e: LibraryEntity) {
  return librarySpace.unparse(e);
}

export interface LibraryEntities {
  kind: "lib";
  self: LibraryEntity;
  modules: ModuleEntity[];
}

export function libraryEntities(
  self: LibraryEntity,
  modules: ModuleEntity[]
): LibraryEntities {
  return {
    kind: "lib",
    self,
    modules,
  };
}
