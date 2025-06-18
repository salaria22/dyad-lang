import { buf2str } from "@juliacomputing/dyad-common";
import {
  ExistsOptions,
  FileSystemInterface,
  ReadDirOptions,
  ReadFileOptions,
  RMDirOptions,
  WriteFileOptions,
} from "./fs.js";

/**
 * This is a simple implementation of a file system that runs in memory.  This is
 * not particularly rigorous (yet).  It's main purpose is for testing.  It largely
 * just reads and writes from a `Map`.
 */
export class InMemoryFileSystem implements FileSystemInterface {
  private files: Map<string, string | Uint8Array> = new Map();
  async mkdir(): Promise<void> {
    // Nothing needs to be done here
  }
  async rmdir(filepath: string, options?: RMDirOptions): Promise<void> {
    if (options !== undefined) {
      throw new Error("Options ignored in InMemoryFileSystem.rmdir");
    }
    const list = [...this.files.keys()].filter((k) => k.startsWith(filepath));
    for (const elem of list) {
      this.files.delete(elem);
    }
  }
  async readdir(filepath: string, options?: ReadDirOptions): Promise<string[]> {
    if (options !== undefined) {
      throw new Error("Options ignored in InMemoryFileSystem.readdir");
    }
    if (filepath.endsWith("/")) {
      filepath = filepath.slice(0, filepath.length - 1);
    }
    const list = [...this.files.keys()]
      .filter((k) => k.startsWith(filepath))
      .map((k) => k.slice(filepath.length))
      .map((k) => (k.startsWith("/") ? k.slice(1) : k));

    return list.filter((k) => k.length > 0 && !k.includes("/"));
  }
  async writeFile(
    filepath: string,
    data: string | Uint8Array,
    options?: WriteFileOptions
  ): Promise<void> {
    if (options !== undefined) {
      throw new Error("Options ignored in InMemoryFileSystem.writeFile");
    }

    const dir = [...this.files.keys()].find(
      (k) => filepath.includes(k) && filepath !== k
    );
    if (dir !== undefined) {
      throw new Error(
        `Cannot create file ${filepath} in directory ${dir} because ${dir} is a file`
      );
    }
    this.files.set(filepath, data);
  }
  async readFile(
    filepath: string,
    options?: ReadFileOptions
  ): Promise<string | Uint8Array> {
    if (options !== undefined) {
      throw new Error("Options ignored in InMemoryFileSystem.readFile");
    }

    const contents = this.files.get(filepath);
    if (contents === undefined) {
      throw new Error(`No file named ${filepath} could be found`);
    }
    return contents;
  }
  async unlink(filepath: string, options?: undefined): Promise<void> {
    if (options !== undefined) {
      throw new Error("Options ignored in InMemoryFileSystem.unlink");
    }

    if (this.files.has(filepath)) {
      this.files.delete(filepath);
    } else {
      throw new Error(`Cannot unlink non-existent file ${filepath}`);
    }
  }
  async rename(oldFilepath: string, newFilepath: string): Promise<void> {
    const contents = this.files.get(oldFilepath);
    if (contents === undefined) {
      throw new Error(
        `Cannot renamed ${oldFilepath} to ${newFilepath} because ${newFilepath} doesn't exit`
      );
    }
    this.files.set(newFilepath, contents);
    this.files.delete(oldFilepath);
  }
  async exists(filename: string, options?: ExistsOptions): Promise<boolean> {
    const isFile = this.files.has(filename);
    if (options?.type === "file") {
      return isFile;
    }
    const pre = filename.endsWith("/") ? filename : `${filename}/`;
    const isDirectory = [...this.files.keys()].some((key) =>
      key.startsWith(pre)
    );
    if (options?.type === "directory") {
      return isDirectory;
    }
    return isFile || isDirectory;
  }

  //   async stat(filepath: string, options?: undefined): Promise<Stats> {
  //     const files = [...this.files.keys()];
  //     if (files.some((fn) => fn.includes(filepath) && fn !== filepath)) {
  //       const ret: Stats = {
  //         type: "dir",
  //         mode: 0o777,
  //         size: 0,
  //         ino: 0,
  //         mtimeMs: 0,
  //         ctimeMs: 0,
  //         uid: 1,
  //         gid: 1,
  //         dev: 1,
  //         isFile: () => false,
  //         isDirectory: () => true,
  //         isSymbolicLink: () => false,
  //       };
  //       return ret;
  //     }
  //     const contents = this.files.get(filepath);
  //     if (contents === undefined) {
  //       throw new Error(`Cannot stat non-existent file ${filepath}`);
  //     }
  //     const ret: Stats = {
  //       type: "file",
  //       mode: 0o777,
  //       size: 0,
  //       ino: 0,
  //       mtimeMs: 0,
  //       ctimeMs: 0,
  //       uid: 1,
  //       gid: 1,
  //       dev: 1,
  //       isFile: () => true,
  //       isDirectory: () => false,
  //       isSymbolicLink: () => false,
  //     };
  //     return ret;
  //   }
  toJSON() {
    const ret: Record<string, string> = {};
    for (const [key, value] of this.files) {
      if (typeof value === "string") {
        ret[key] = value;
      } else {
        ret[key] = buf2str(value);
      }
    }
    return ret;
  }
}
