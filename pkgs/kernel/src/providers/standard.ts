import { Observable, ReplaySubject, Subject, map } from "rxjs";
import { LibraryProvider } from "./provider.js";
import {
  AffectedFiles,
  FileEvent,
  LibraryEvent,
  WriteResponse,
} from "./events.js";
import { assetKey, sourceKey } from "@juliacomputing/dyad-ast";
import { nanoid } from "nanoid";
import {
  ProviderKey,
  manifestKey,
  projectKey,
  switchProviderKey,
} from "./keys.js";
import { ProjectTOML, parseProject } from "./project.js";
import { NoSuchFile } from "./problems.js";
import { LibraryModule } from "./modules.js";
import { lastValue, lastValueMaybe, update } from "./last.js";
import {
  arr2buf,
  buf2str,
  createError,
  fileExtension,
  sourceFolder,
  str2buf,
} from "@juliacomputing/dyad-common";
import { SetOptions } from "./options.js";
import {
  ExistsOptions,
  MinimalFileSystemInterface,
  ReadDirOptions,
  ReadFileOptions,
  UnlinkOptions,
  WriteFileOptions,
} from "./fs.js";
import { catchEitherAsync } from "../flow.js";
import path from "path-browserify";

import debug from "debug";
import { Just, Maybe, Nothing } from "purify-ts";

const standardLog = debug("events:slp");

export const MissingProjectFile = createError(
  "missing-project-toml",
  "Missing Project.toml file"
);

export const ReadOnlyProvider = createError(
  "readonly-provider",
  "Read-Only Provider"
);
export const AlreadyConnected = createError(
  "already-connected",
  "Library provider was already connected"
);

export abstract class StandardLibraryProvider
  implements LibraryProvider, MinimalFileSystemInterface
{
  /** This is the source for the `events` Observable */
  private eventSubject: Subject<FileEvent>;
  /** Keep track of whether this has already been connected */
  private connected: boolean = false;

  /** Pipeline of Project details */
  protected projectPipeline = new ReplaySubject<ProjectTOML>();
  /** Pipeline of versions */
  private versionPipeline = new ReplaySubject<number>();
  /** Pipeline of modules */
  private modulePipeline = new ReplaySubject<Array<LibraryModule>>();

  constructor(protected readonly providerType: string) {
    this.eventSubject = new ReplaySubject(undefined, 100000);
    this.versionPipeline.next(0);
  }

  /** Returns the provider type for this library provider */
  type(): string {
    return this.providerType;
  }

  uuid(): string {
    return lastValue(this.projectPipeline).uuid;
  }

  project(): Observable<ProjectTOML> {
    return this.projectPipeline;
  }

  modules(): Observable<Array<LibraryModule>> {
    return this.modulePipeline;
  }

  public version(): Observable<string> {
    return this.versionPipeline.pipe(
      map((x) => `urn:${this.providerType}:version:${this.uuid()}:${x}`)
    );
  }

  async list<K extends ProviderKey>(providerKey: K): Promise<Array<K>> {
    // Initialize the return value
    const ret: Array<K> = [];
    // Determine the path prefix given the provider key
    const pre = this.prefix(providerKey);

    // If the prefix path is not a directory, we can't read it.
    if (!(await this.exists(pre, { type: "directory" }))) {
      return ret;
    }

    // Find all files with this path prefix (that don't have any additional '/' after the prefix)
    const files = await this.readdir(pre, { providerKey });

    // Iterate over all the full path values returned by readDir
    for (const file of files) {
      // If we are listing source files, we only care about .dyad files
      if (providerKey.kind === "src" && !file.endsWith(`.${fileExtension}`)) {
        continue;
      }
      // Add this to the return list
      ret.push({ ...providerKey, file: file });
    }
    return ret;
  }

  /** This method indicates whether this provider is writeable */
  abstract writeable(): boolean;

  /**
   * This method is called just before connect allowing the provider to perform
   * an async initialization prior to the registration process.
   */
  async init(): Promise<void> {
    await this.initializeFilesystem();

    // Now assume that the Project.toml file is available and push out an
    // initial version to the projectPipeline
    try {
      const contents = await this.readFile("./Project.toml", {
        providerKey: projectKey,
      });
      const str = typeof contents === "string" ? contents : buf2str(contents);
      const proj = parseProject(str) as any;
      this.projectPipeline.next(proj);
    } catch (e) {
      throw new MissingProjectFile(
        this.providerType,
        `Provider of type ${this.providerType} contained no Project.toml file once the filesystem was initialized`
      );
    }
  }

  /** Once this method is invoked, all the following filesystem related functions should be ready for requests. */
  abstract initializeFilesystem(): Promise<void>;

  /** This method determines if a given file exists */
  abstract exists(filename: string, options?: ExistsOptions): Promise<boolean>;

  /** Returns a list of any files in the specified directory (just filename, no path) */
  abstract readdir(
    filepath: string,
    options?: ReadDirOptions
  ): Promise<Array<string>>;

  abstract readFile(
    filename: string,
    options?: ReadFileOptions
  ): Promise<string | Uint8Array>;

  abstract writeFile(
    filename: string,
    contents: string | ArrayBuffer,
    options?: WriteFileOptions
  ): Promise<void>;

  abstract unlink(filename: string, options?: UnlinkOptions): Promise<void>;

  async has(providerKey: ProviderKey): Promise<boolean> {
    const key = this.path(providerKey);
    return this.exists(key, { type: "file" });
  }

  async get(providerKey: ProviderKey): Promise<ArrayBuffer> {
    const proj = lastValue(this.projectPipeline);
    const key = this.path(providerKey);
    try {
      const ret = await this.readFile(key, { providerKey });
      return typeof ret === "string" ? str2buf(ret) : arr2buf(ret);
    } catch (e) {
      return switchProviderKey<never>(providerKey, {
        source: (file, mod) => {
          throw new NoSuchFile(
            key,
            `No Dyad source file named ${file} in module ${JSON.stringify(
              mod
            )} found in library ${proj.name}`
          );
        },
        asset: (file) => {
          throw new NoSuchFile(
            key,
            `No asset named ${file} in library ${proj.name}`
          );
        },
        julia: (file, mod) => {
          throw new NoSuchFile(
            key,
            `No Julia source file named ${file} in module ${JSON.stringify(
              mod
            )} found in library ${proj.name}`
          );
        },
        test: (file, mod) => {
          throw new NoSuchFile(
            key,
            `No Julia test file named ${file} in module ${JSON.stringify(
              mod
            )} found in library ${proj.name}`
          );
        },
        project: () => {
          throw new NoSuchFile(
            key,
            `No Project.toml found in library ${proj.name}`
          );
        },
        manifest: () => {
          throw new NoSuchFile(
            key,
            `No Manifest.toml found in library ${proj.name}`
          );
        },
      });
    }
  }

  async set(
    providerKey: ProviderKey,
    data: string | ArrayBuffer,
    options?: SetOptions
  ): Promise<WriteResponse> {
    const skipReparse = options?.skipReparse ?? false;

    if (!this.writeable()) {
      const proj = await lastValue(this.project());
      throw new ReadOnlyProvider(
        this.uuid(),
        `Library ${proj.name} (of type '${this.providerType}' is not writeable`
      );
    }
    const key = this.path(providerKey);
    const cur = (
      await catchEitherAsync(() => this.readFile(key, { providerKey }))
    ).map((result) =>
      typeof result === "string" ? str2buf(result) : arr2buf(result)
    );
    // const cur = await this.readFile(key, { providerKey });
    const has = cur.isRight();

    /** Get the current contents as an array buffer */
    const contents = typeof data === "string" ? str2buf(data) : data;

    // If there is no project information yet and this update is the first
    // information about the project, then inject it into the project pipeline.
    // But otherwise, this should be handled downstream somehow *after* the file
    // has been written.
    if (
      lastValueMaybe(this.projectPipeline).isNothing() &&
      providerKey.kind === "proj"
    ) {
      this.projectPipeline.next(
        parseProject(buf2str(contents)) as any as ProjectTOML
      );
    }

    const transactionId = this.generateTransactionId();

    await cur.caseOf({
      /** This file is new */
      Left: async () => {
        await this.writeFile(key, contents, {
          mode: 0o777,
          providerKey,
        });
        update(this.versionPipeline, (v) => v + 1);
        await this.sendEvent(
          transactionId,
          { added: [providerKey] },
          skipReparse
        );
      },
      Right: async () => {
        await this.writeFile(key, contents, { mode: 0o777, providerKey });
        update(this.versionPipeline, (v) => v + 1);
        await this.sendEvent(
          transactionId,
          { changed: [providerKey] },
          skipReparse
        );
      },
    });

    // FIX: I think this should be:
    // const mutated = ret || contents !== cur;
    // ...or just compare version numbers
    const mutated = has;
    const version = await lastValue(this.version());
    return {
      mutated,
      version,
      transactionId,
    };
  }

  async del(providerKey: ProviderKey): Promise<WriteResponse> {
    if (!this.writeable()) {
      const proj = await lastValue(this.project());
      throw new ReadOnlyProvider(
        this.uuid(),
        `Library ${proj.name} (of type '${this.providerType}' is not writeable`
      );
    }

    const key = this.path(providerKey);
    const ret = await this.exists(key, { type: "file" });
    const transactionId = this.generateTransactionId();
    if (ret) {
      await this.unlink(key, { providerKey });
      // NB - version must be incremented before sending event
      update(this.versionPipeline, (v) => v + 1);
      await this.sendEvent(transactionId, { deleted: [providerKey] }, false);
    } else {
      await this.sendEvent(transactionId, {}, false);
    }

    const version = await lastValue(this.version());
    return {
      mutated: ret,
      version,
      transactionId,
    };
  }

  /**
   * This function walks the file system and discovers every source file and the
   * module it belongs to.
   */
  private async discover(mod: string[], result: Map<string, string[]>) {
    const moddir = path.join(sourceFolder, ...mod);
    const contents = await this.readdir(moddir);
    for (const entry of contents) {
      try {
        if (entry.endsWith(".dyad")) {
          const cur = result.get(moddir) ?? [];
          cur.push(entry);
          result.set(mod.join("/"), cur);
        } else {
          // This should fail if this entry isn't a directory
          await this.discover([...mod, entry], result);
        }
      } catch {
        // Do nothing
      }
    }
  }

  /**
   * Walk the file system and identify modules
   */
  private async updateModules() {
    // Create a of what source files are in what module (key=module, value=sources)
    const hierarchy = new Map<string, string[]>();
    // Assume a root module is present
    hierarchy.set("", []);
    // Use the file system API (readdir) to find all source files and associate them with a module
    await this.discover([], hierarchy);
    // Convert string representations of modules in to string[] representations
    const mods = [...hierarchy.keys()].map((x) =>
      x === "" ? [] : x.split("/")
    );
    // Push this list into the module pipeline
    this.modulePipeline.next(mods);
  }

  async connect(): Promise<LibraryEvent> {
    if (this.connected) {
      // If we were already connected, we assume uuid is available...
      throw new AlreadyConnected(
        this.uuid(),
        `LibraryProvider for library ${this.uuid()} as already connected but was asked (again) to connect`
      );
    }
    try {
      const transactionId = this.generateTransactionId();

      // Update modules
      await this.updateModules();

      // Prepare a list of all initial files
      let files: ProviderKey[] = [];

      // Find source files by asking for the source files in each module
      for (const mod of lastValue(this.modulePipeline)) {
        const sources = await this.list(sourceKey("*", mod));
        files.push(...sources);
      }

      // Find the asset files by simply asking the provider to list them
      const assets = await this.list(assetKey("*"));
      files.push(...assets);

      standardLog(
        "Preparing event %s with %d files",
        transactionId,
        files.length
      );

      // Send an event saying all these files were added
      await this.sendEvent(transactionId, { added: files }, false);
      this.connected = true;
      return {
        kind: "lib",
        mutated: true,
        transactionId,
        version: await lastValue(this.version()),
      };
    } catch (e) {
      console.error("Error while registering provider: ", e);
      throw e;
    }
  }

  get events(): Observable<FileEvent> {
    return this.eventSubject;
  }

  close() {
    this.eventSubject.complete();
  }

  /** Translate a provider key into a path */
  private prefix(key: ProviderKey): string {
    return switchProviderKey(key, {
      source: (_, module) => {
        return `./${sourceFolder}/${modpath(module)}`;
      },
      asset: () => {
        return `./assets/`;
      },
      julia: (_, module) => {
        return `./generated/${modpath(module)}/`;
      },
      test: (_, module) => {
        return `./generated/${modpath(module)}/`;
      },
      project: () => {
        return "./Project.toml";
      },
      manifest: () => {
        return "./Manifest.toml";
      },
    });
  }

  /**
   * Given a file path (relative to the root of the Julia package with
   * no lead `.` or `/`), return the `ProviderKey`
   */
  public key(filename: string): Maybe<ProviderKey> {
    if (filename === "Project.toml") {
      return Just(projectKey);
    }

    // If this is picking up a change in the `Manifest.toml` file, then trigger
    // then add that to the set of affected files.
    if (filename === "Manifest.toml") {
      return Just(manifestKey);
    }

    // Check if this is a Dyad source file
    if (
      filename.startsWith(`${sourceFolder}/`) &&
      filename.endsWith(`.${fileExtension}`)
    ) {
      // If so, construct the `SourceKey` for it and then add
      // that key to the `AffectedFiles`
      const source = path.relative(sourceFolder, filename);
      const dir = path.dirname(source);
      const mod = dir === "" || dir === "." ? [] : dir.split(path.sep);
      const base = path.basename(source);
      return Just(sourceKey(base, mod));
    }

    if (filename.startsWith("assets/")) {
      return Just(assetKey(filename.slice("assets/".length)));
    }
    return Nothing;
  }

  /**
   * Maps a given key to a file name.
   *
   * NB - DO NOT use this to circumvent the `set` and `get` methods by reading
   * and writing directly to the file system.
   **/
  public path(key: ProviderKey): string {
    switch (key.kind) {
      case "proj": {
        return this.prefix(key);
      }
      case "manifest": {
        return this.prefix(key);
      }
      default: {
        return `${this.prefix(key)}${key.file}`;
      }
    }
  }

  protected generateTransactionId() {
    return `urn:${this.providerType}:transaction:${this.uuid()}:${nanoid()}`;
  }

  protected async sendEvent(
    transactionId: string,
    args: Partial<AffectedFiles>,
    skipReparse: boolean
  ): Promise<void> {
    const proj = lastValue(this.projectPipeline);
    const version = await lastValue(this.version());
    const event: FileEvent = {
      kind: "file",
      uuid: proj.uuid,
      name: proj.name,
      version: version,
      transactionId,
      added: args.added ?? [],
      changed: args.changed ?? [],
      deleted: args.deleted ?? [],
      date: new Date(),
      skipReparse,
    };
    this.eventSubject.next(event);
    standardLog(
      ">> %s: Found %d affected files",
      event.transactionId,
      event.added.length + event.changed.length + event.deleted.length
    );
  }
}

function modpath(path: string[]) {
  return path.length === 0 ? "" : path.join("/") + "/";
}
