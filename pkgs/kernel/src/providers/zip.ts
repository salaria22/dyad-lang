import { BlobReader, BlobWriter, Entry, ZipReader } from "@zip.js/zip.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { normalizePath } from "../workspace/utils.js";
import { StandardLibraryProvider } from "./standard.js";
import { ExistsOptions } from "./fs.js";

export class ZipProvider extends StandardLibraryProvider {
  private zipReader!: ZipReader<unknown>;
  private entries: Entry[] = [];
  constructor(protected urlOrBlob: string | Blob) {
    super("zip");
  }
  public async zip() {
    const blob =
      typeof this.urlOrBlob === "string"
        ? await fetch(this.urlOrBlob).then((r) => r.blob())
        : this.urlOrBlob;
    return blob.arrayBuffer();
  }
  async initializeFilesystem() {
    const blob =
      typeof this.urlOrBlob === "string"
        ? await fetch(this.urlOrBlob).then((r) => r.blob())
        : this.urlOrBlob;
    const blobReader = new BlobReader(blob);
    this.zipReader = new ZipReader(blobReader);
    this.entries = await this.zipReader.getEntries();
  }
  writeable(): boolean {
    return false;
  }
  private findEntry(filename: string): Maybe<Entry> {
    for (const entry of this.entries) {
      if (normalizePath(entry.filename) === normalizePath(filename)) {
        return Just(entry);
      }
    }
    return Nothing;
  }

  async exists(filename: string, options?: ExistsOptions): Promise<boolean> {
    const normFilename = normalizePath(filename);
    const isFile = this.findEntry(normFilename).isJust();

    if (options?.type === "file") {
      return isFile;
    }

    const pre = normFilename.endsWith("/") ? normFilename : `${normFilename}/`;
    const isDirectory = this.entries.some((entry) =>
      normalizePath(entry.filename).startsWith(pre)
    );

    if (options?.type === "directory") {
      return isDirectory;
    }

    return isFile || isDirectory;
  }
  async readdir(dirname: string): Promise<string[]> {
    const normdir = normalizePath(dirname);
    const ret: string[] = [];
    for (const entry of this.entries) {
      const norm = normalizePath(entry.filename);
      if (norm.startsWith(normdir)) {
        const rest = norm.slice(normdir.length);
        // If this file isn't nested inside an additional directory, then add it
        if (rest.indexOf("/") === -1) {
          ret.push(rest);
        }
      }
    }
    return ret;
  }
  async readFile(filename: string): Promise<string | Uint8Array> {
    const entry = this.findEntry(filename);
    return await entry.caseOf({
      Nothing: async () => {
        throw new Error(`File ${filename} not found in ZipProvider`);
      },
      Just: async (e) => {
        if (e.getData) {
          try {
            const writer = new BlobWriter();
            const data = await e.getData(writer);
            const buf = await data.arrayBuffer();
            return new Uint8Array(buf);
          } catch (e: any) {
            console.error(
              `Error reading file ${filename} from Zip file: ${e.message}`
            );
            throw e;
          }
        }
        throw new Error(
          `No getData method for entry corresponding to file ${filename} in Zip file containing library ${this.uuid()}`
        );
      },
    });
  }
  writeFile(): Promise<void> {
    // This should never be called since we signal that we are not writeable
    throw new Error("Method not implemented.");
  }
  unlink(): Promise<void> {
    // This should never be called since we signal that we are not writeable
    throw new Error("Method not implemented.");
  }
}
