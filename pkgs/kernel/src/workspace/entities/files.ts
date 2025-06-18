import { LibraryEntity } from "./libraries.js";
import { ModuleEntity } from "./modules.js";
import { DefinitionEntity } from "./definitions.js";
import { FastURN, FastURNSpace } from "./fast.js";

const fileSpace = new FastURNSpace("parsedfile", (nss) => {
  const parts = nss.split(":");
  const library = parts[0];
  const modules = unparseModuleString(parts[1]);
  const file = parts[2];
  return { library, modules, file };
});
export type FileEntity = FastURN<"parsedfile">;

export function isFileEntity(e: string): e is FileEntity {
  return fileSpace.is(e);
}

export function fileEntity(
  lib: string,
  mods: string[],
  file: string
): FileEntity {
  return fileSpace.create(`${lib}:${mods.join(".")}:${file}`);
}

export function unparseFileEntity(e: FileEntity) {
  return fileSpace.unparse(e);
}

export interface FileEntities {
  kind: "file";
  self: FileEntity;
  library: LibraryEntity;
  module: ModuleEntity;
  definitions: DefinitionEntity[];
}

export function fileEntities(
  self: FileEntity,
  library: LibraryEntity,
  module: ModuleEntity,
  definitions: DefinitionEntity[]
): FileEntities {
  return {
    kind: "file",
    self,
    library,
    module,
    definitions,
  };
}

export function unparseModuleString(modstr: string) {
  if (modstr === "") {
    return [];
  }
  return modstr.split(".");
}
