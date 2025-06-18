import { projectKey } from "./keys.js";
import { ProjectTOML, stringifyProject } from "./project.js";
import { StandardLibraryProvider } from "./standard.js";
import { ExistsOptions, FileSystemInterface } from "./fs.js";
import path from "path-browserify";

export class InMemoryLibraryProvider
  extends StandardLibraryProvider
  implements FileSystemInterface
{
  private fileContents: Map<string, string | Uint8Array>;
  private readOnly: boolean = false;
  constructor(protected initialProject?: ProjectTOML) {
    super("inmem2");
    this.fileContents = new Map();
  }
  public setReadonly(flag: boolean) {
    this.readOnly = flag;
  }
  writeable(): boolean {
    return !this.readOnly;
  }
  async initializeFilesystem() {
    const init = this.initialProject;
    if (init) {
      await this.set(projectKey, stringifyProject(init as any));
    }
    // So initialization only runs once
    this.initialProject = undefined;
  }

  async mkdir(): Promise<void> {
    // Does nothing really
  }
  async rmdir(): Promise<void> {
    // Does nothing really
  }
  async rename(oldFilepath: string, newFilepath: string): Promise<void> {
    const cur = this.fileContents.get(path.normalize(oldFilepath));
    if (cur) {
      this.fileContents.set(path.normalize(newFilepath), cur);
      this.fileContents.delete(path.normalize(oldFilepath));
    } else {
      throw new Error(`Cannot rename file ${oldFilepath}, it doesn't exist`);
    }
  }
  /** This method determines if a given file (full path name) exists */
  async exists(filename: string, options?: ExistsOptions): Promise<boolean> {
    const normFilename = path.normalize(filename);
    const isFile = this.fileContents.has(normFilename);
    if (options?.type === "file") {
      return isFile;
    }
    const pre = normFilename.endsWith("/") ? normFilename : `${normFilename}/`;
    const isDirectory = [...this.fileContents.keys()].some((key) =>
      key.startsWith(pre)
    );
    if (options?.type === "directory") {
      return isDirectory;
    }
    return isFile || isDirectory;
  }

  /**
   * Find all files in the directory specified and return their full path (but exclude
   * any files in subdirectories below the specified directory)
   **/
  async readdir(rawDirname: string): Promise<Array<string>> {
    const prefix =
      path.normalize(rawDirname) === "." ? "" : path.normalize(rawDirname);
    const prefixed = [...this.fileContents.keys()].filter((x) =>
      x.startsWith(prefix)
    );
    const stripped = prefixed
      .map((x) => x.slice(prefix.length))
      .map((x) => (x.startsWith("/") ? x.slice(1) : x))
      .map((x) => (x.indexOf("/") === -1 ? x : x.slice(0, x.indexOf("/"))));
    return [...new Set(stripped)];
  }

  /** Read the file given by the filename (full path) */
  async readFile(filename: string): Promise<string | Uint8Array> {
    const contents = this.fileContents.get(path.normalize(filename));
    if (contents === undefined) {
      throw new Error(`File ${filename} not found in InMemoryLibraryProvider`);
    }
    return contents;
  }

  /** Write to the file given by the filename (full path) */
  async writeFile(
    filename: string,
    contents: string | Uint8Array
  ): Promise<void> {
    this.fileContents.set(path.normalize(filename), contents);
  }

  /**
   * Delete the file given by the file name (full path) and return if an
   * actual file was there to be deleted.
   **/
  async unlink(filename: string): Promise<void> {
    this.fileContents.delete(path.normalize(filename));
    return;
  }
}
