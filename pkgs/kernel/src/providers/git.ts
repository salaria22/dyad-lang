import FS from "@isomorphic-git/lightning-fs";
import gitDoNotExport, { HttpClient } from "isomorphic-git";

// We use dynamic imports here because this resolves to an ESM
// module and this causes problems downstream if we are using
// CJS (e.g., Dyad Studio).  By making it dynamic, we can
// mix the ESM module in here.  This isn't a problem because
// everywhere this module is used is already in an **async**
// context anyway (see below).
//const httpImport = import("isomorphic-git/http/web/index.js");
import httpDoNotExport from "isomorphic-git/http/web/index.js";

import path from "path-browserify";
import { StandardLibraryProvider } from "./standard.js";
import {
  ExistsOptions,
  FileSystemInterface,
  MKDirOptions,
  RMDirOptions,
  WriteFileOptions,
} from "./fs.js";

export interface GitProviderOptions {
  headers: () => { [key: string]: string };
  fs: Omit<FS.Options, "db">;
}

export class GitProvider
  extends StandardLibraryProvider
  implements FileSystemInterface
{
  private fs: FS;
  private options: GitProviderOptions;
  protected http: HttpClient = httpDoNotExport;
  protected git = gitDoNotExport;

  constructor(
    protected url: string,
    protected workdir: string,
    protected opts?: Partial<GitProviderOptions>
  ) {
    super("git");
    this.options = {
      headers: opts?.headers ?? (() => ({})),
      fs: opts?.fs ?? { wipe: true },
    };

    // This cast is because `db` is a required "option" which doesn't really
    // make sense.
    this.fs = new FS("fs", this.options.fs as unknown as FS.Options);
  }
  private localPath(filename: string): string {
    if (filename.startsWith("./")) {
      return path.join(this.workdir, filename.slice(2));
    }
    return path.join(this.workdir, filename);
  }

  public fileSystem() {
    return this.fs;
  }

  async initializeFilesystem() {
    const fs = this.fs;

    try {
      await fs.promises.stat(this.workdir);
    } catch (e) {
      await fs.promises.mkdir(this.workdir);
    }
    const dir = this.workdir;
    const url = this.url;

    // const http = await httpImport;

    if (url === "") {
      await this.git.init({
        fs,
        dir,
        defaultBranch: "main",
      });
    } else {
      await this.git.clone({
        fs,
        http: this.http,
        dir,
        // corsProxy: "https://cors.isomorphic-git.org",
        url,
        // singleBranch: true,
        // depth: 10,
        headers: this.options.headers(),
      });
    }
  }
  writeable(): boolean {
    return true;
  }

  async mkdir(filepath: string, options?: MKDirOptions): Promise<void> {
    const full = this.localPath(filepath);
    await this.fs.promises.mkdir(full, { mode: options?.mode || 0o777 });
  }
  async rmdir(filepath: string, options?: RMDirOptions): Promise<void> {
    if (options !== undefined) {
      console.warn("Options ignored in GitProvider.rmdir");
    }
    const full = this.localPath(filepath);
    await this.fs.promises.rmdir(full);
  }
  async rename(oldFilepath: string, newFilepath: string): Promise<void> {
    const fullOld = this.localPath(oldFilepath);
    const fullNew = this.localPath(newFilepath);
    await this.fs.promises.rename(fullOld, fullNew);
  }

  async exists(filename: string, options?: ExistsOptions): Promise<boolean> {
    const full = this.localPath(filename);
    try {
      const stats = await this.fs.promises.stat(full);
      if (options?.type === "file") {
        return stats.isFile();
      }
      if (options?.type === "directory") {
        return stats.isDirectory();
      }
      return true;
    } catch {
      return false;
    }
  }
  async readdir(dirname: string): Promise<string[]> {
    const full = this.localPath(dirname);
    const files = await this.fs.promises.readdir(full);
    return files;
  }
  async readFile(filename: string): Promise<string | Uint8Array> {
    const full = this.localPath(filename);
    const contents = await this.fs.promises.readFile(full);
    return contents;
  }
  async writeFile(
    filename: string,
    contents: string | Uint8Array,
    options?: WriteFileOptions
  ): Promise<void> {
    if (options !== undefined) {
      console.warn(
        `Options ignored in GitProvider.writeFile: ${JSON.stringify(options)}`
      );
    }

    const full = this.localPath(filename);
    await this.fs.promises.writeFile(full, contents);
    return;
  }
  async unlink(filename: string): Promise<void> {
    const full = this.localPath(filename);
    await this.fs.promises.unlink(full);
  }

  async publish(gitoptions: {
    remoteRef?: string;
    ref?: string;
  }): Promise<void> {
    const fs = this.fs;

    const dir = this.workdir;
    const url = this.url;

    // const http = await httpImport;

    await this.git.push({
      fs,
      http: this.http,
      dir,
      // corsProxy: "https://cors.isomorphic-git.org",
      url,
      ref: gitoptions.ref ?? "main",
      remoteRef: gitoptions.remoteRef ?? "main",
      headers: this.options.headers(),
    });
  }
}
