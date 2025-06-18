import { Observable } from "rxjs/internal/Observable";
import { FileEvent, LibraryEvent, WriteResponse } from "./events.js";
import { ProviderKey } from "./keys.js";
import { ProjectTOML } from "./project.js";
import { LibraryModule } from "./modules.js";
import { SetOptions } from "./options.js";

/**
 * This implements an abstract file system for managing Dyad source code.
 * There are a few implicit assumptions here.
 *
 * * First, we assume that all Dyad code for a given library is contained a
 *   single directory.  This doesn't limit the underlying Julia code in any way
 *   (you can use `include` all you want in the Julia code and pull that source
 *   from anywhere).  This only applies to the Dyad code.
 * * Second, we only provide very limited I/O operations because we really don't
 *   need much of a file system here. The goal is that this interface could be
 *   easily implemented in terms of a real file system, a browser based file
 *   system, a remote Git repository, or even just a Javascript "object".
 *
 * NB - for "external" (non-Dyad) MTK libraries we'll have to rely on some
 * kind of generated file that contains all the readonly information we
 * required.
 *
 */
export interface LibraryProvider {
  /** A simple string indicating what type of provider this is. */
  type(): string;

  /** Every library must have an *invariant* UUID (this is the UUID of the
   * underlying Julia package). */
  uuid(): string;

  /**
   * Any async initialization required, must be called before any other calls.
   * This is called when a provider is registered, but it should be idempotent
   * just to be safe.
   **/
  init(): Promise<void>;

  /** Writeable */
  writeable(): boolean;

  /**
   * An observable that notifies subscribers when a new Project.toml file has been
   * published.  The latest version can be retrieved using the `lastValue` function.
   */
  project(): Observable<ProjectTOML>;

  /** A list of the modules in this library.  This might change dynamically. */
  modules(): Observable<Array<LibraryModule>>;

  /** List all files matching the _glob patterns_ (for the `file` portion **only**) in the key: */
  list<K extends ProviderKey>(key: K): Promise<Array<K>>;

  /** Determine if a given file already exists in provider. */
  has(key: ProviderKey): Promise<boolean>;

  /** Get the contents of a given file.  Return value is a promise to the contents */
  get(key: ProviderKey): Promise<ArrayBuffer>;

  /** Set the contents of a given file, returns a transaction id for the write operation */
  set(
    key: ProviderKey,
    contents: string | ArrayBuffer,
    options?: SetOptions
  ): Promise<WriteResponse>;

  /** Delete a given file, returns the transaction id of the delete operation. */
  del(key: ProviderKey): Promise<WriteResponse>;

  /** This method provides the current version of this particular provider's files */
  version(): Observable<string>;

  /**
   * This method should send a FileEvent adding all initial files!
   */
  connect(): Promise<LibraryEvent>;

  events: Observable<FileEvent>;

  close(): void;
}

export function equalArrayBuffer(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);

  return av.every((v, i) => v === bv[i]);
}
