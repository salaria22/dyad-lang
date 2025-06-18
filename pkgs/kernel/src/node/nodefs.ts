import fs from "fs";
import path from "path";
import debug from "debug";
import {
  StandardLibraryProvider,
  FileSystemInterface,
  MKDirOptions,
  AffectedFiles,
  projectKey,
  ProviderKey,
  manifestKey,
  ExistsOptions,
} from "../providers/index.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import chokidar from "chokidar";
import { sourceKey } from "@juliacomputing/dyad-ast";
import { lastValueMaybe } from "../providers/last.js";
import { fileExtension, sourceFolder } from "@juliacomputing/dyad-common";

const codegenLog = debug("codegen:fshandler");
const chLog = debug("fs:chokidar");
const fsLog = debug("fs:node-async");
const eventLog = debug("events:nodefs");

/**
 * These are the files and directories that should be watched
 */
export const dyadWatchTargets = [
  "Project.toml",
  "Manifest.toml",
  "assets",
  "dyad",
];

/**
 * This is an implementation of the AbstractFileSystem that uses the standard
 * node `fs` package to implement file system operations.  Obviously, this will
 * not work in a browser context so it would eventually need to be moved to a
 * separate package so that it didn't get bundled for the browser.
 */
export class NodeAsyncFileSystem
  extends StandardLibraryProvider
  implements FileSystemInterface
{
  private watcher: Maybe<chokidar.FSWatcher> = Nothing;
  private pendingTimer: Maybe<NodeJS.Timeout> = Nothing;
  private bufferedEvents: AffectedFiles = {
    added: [],
    changed: [],
    deleted: [],
  };
  protected debounceInterval = 20;
  protected dirname: string;

  constructor(
    protected dir: string,
    watch: string[]
  ) {
    super("nodefs");
    this.dirname = path.resolve(dir);
    const targets = watch
      ? watch.map((x) => path.join(this.dirname, x).replaceAll("\\", "/"))
      : [];
    if (watch.length > 0) {
      fsLog("Watching: %j", targets);
      const watcher = chokidar.watch(targets, { persistent: true });
      watcher.on("all", (eventType, path) => this.handleEvent(eventType, path));
      this.watcher = Just(watcher);
    }
  }
  private localPath(p: string): string {
    const ret = path.join(this.dirname ?? "", p);
    return ret;
  }
  public absolutePath(p: ProviderKey) {
    const dir = this.path(p);
    return path.join(this.dirname ?? "", dir);
  }
  writeable(): boolean {
    return true;
  }
  async initializeFilesystem(): Promise<void> {}
  async mkdir(filepath: string, options?: MKDirOptions): Promise<void> {
    codegenLog("      calling NodeFileSystem.mkdir");
    const full = this.localPath(filepath);
    codegenLog("      full = %s", full);
    try {
      await fs.promises.mkdir(full, { recursive: options?.recursive ?? false });
      codegenLog("      ...success");
      fsLog("Created directory %s", full);
      return;
    } catch (e: unknown) {
      codegenLog("      ...exception thrown: %s", (e as any).message);
      throw e;
    }
  }
  async rmdir(filepath: string): Promise<void> {
    const full = this.localPath(filepath);
    await fs.promises.rmdir(full);
    fsLog("Removed directory %s", filepath);
  }
  async rename(oldFilepath: string, newFilepath: string): Promise<void> {
    const oldFull = this.localPath(oldFilepath);
    const newFull = this.localPath(newFilepath);
    await fs.promises.rename(oldFull, newFull);
    fsLog("Renamed file %s => %s", oldFull, newFull);
  }
  async exists(filename: string, options?: ExistsOptions): Promise<boolean> {
    const full = this.localPath(filename);
    try {
      const stats = await fs.promises.stat(full);
      if (options?.type === "file") {
        return stats.isFile();
      }
      if (options?.type === "directory") {
        return stats.isDirectory();
      }
      fsLog("File %s exists", full);
      return true;
    } catch (e: unknown) {
      fsLog("File %s does not exist", full);
      return false;
    }
  }
  async readdir(dirname: string): Promise<string[]> {
    const full = this.localPath(dirname);
    const files = await fs.promises.readdir(full);
    fsLog("Directory %s contains: %j", full, files);
    return files;
  }
  async readFile(filename: string): Promise<string | Uint8Array> {
    const full = this.localPath(filename);
    const contents = await fs.promises.readFile(full);
    fsLog("Read file %s", full);
    return contents;
  }
  async writeFile(
    filename: string,
    contents: string | ArrayBuffer
  ): Promise<void> {
    const full = this.localPath(filename);
    await fs.promises.writeFile(
      full,
      typeof contents === "string" ? contents : Buffer.from(contents)
    );
    fsLog("Write file %s", full);
    return;
  }
  async unlink(filename: string): Promise<void> {
    const full = this.localPath(filename);
    await fs.promises.unlink(full);
    fsLog("Deleted file %s", full);
    return;
  }

  /**
   * Send any pending `AffectedFile`s to the `StandardLibraryProvider` for
   * processing.  This function is debounced, _i.e.,_ it will actually wait
   * to make sure it isn't called again within the debounce interval before
   * actually sending the event.
   */
  private sendEventsDebounced(immediate: boolean): void {
    const process = () => {
      const nothingChanged =
        this.bufferedEvents.added.length === 0 &&
        this.bufferedEvents.changed.length === 0 &&
        this.bufferedEvents.deleted.length === 0;

      // Don't bother sending an event if nothing actually changed
      if (nothingChanged) {
        return;
      }

      // Create a transaction id
      const files = this.bufferedEvents;
      const transactionId = this.generateTransactionId();
      eventLog(
        ">> %s: NodeAsyncFileSystem sending buffered events",
        transactionId
      );
      // Send the event (and catch any errors so we don't have dangling promises)
      this.sendEvent(transactionId, files, false).catch((e) => {
        console.error("Error sending debounced event: ", e);
      });
      // Clear the affected files since the event was actually triggered
      this.bufferedEvents = { added: [], changed: [], deleted: [] };
    };

    if (immediate) {
      process();
    } else {
      // If there are any pending timers, clear them because we are going
      // to overwrite them.
      this.pendingTimer.ifJust(clearTimeout);

      // Set the new timer
      this.pendingTimer = Just(setTimeout(process, this.debounceInterval));
    }
  }

  /**
   * This method handles filesystem events.  These should _eventually_ translate
   * into `LibraryProvider` events but there are two complications.  First, we
   * can't really send library events until we have a **library** and that doesn't
   * happen until we receive `Project.toml` file.  So we don't even attempt to
   * send out the list of `AffectedFiles` for broadcast until we have that (this
   * is because `sendEvent` needs that information).  Second, even if we have
   * the `Project.toml` file in the `projectPipeline`, we don't want to send
   * each event individually.  So, we **buffer** them up and debounce them.
   *
   * @param eventType "add" | "change" | "unlink"
   * @param filename
   */
  private handleEvent(eventType: string, filename: string) {
    chLog("Got filesystem event %s for file %s", eventType, filename);
    // A helper function that translates `chokidar` information into
    // `AffectedFile` entries.
    const processFile = (key: ProviderKey) => {
      if (eventType === "add") {
        this.bufferedEvents.added.push(key);
      } else if (eventType === "change") {
        this.bufferedEvents.changed.push(key);
      } else if (eventType === "unlink") {
        this.bufferedEvents.deleted.push(key);
      }
    };

    // The path of this file with respect to the root directory of this library.
    const rel = path.relative(this.dirname, filename);
    chLog("  Relative path is %s", rel);

    // Is there anything in the `projectPipeline` yet?
    const hasProj = lastValueMaybe(this.projectPipeline).isJust();

    const prefix1 = `${sourceFolder}\\`;
    const prefix2 = `${sourceFolder}/`;
    const suffix = `.${fileExtension}`;

    if (rel === "Project.toml") {
      if (!hasProj) {
        // If there is no current project information, go ahead an initiate the
        // `init` of the provider which will read the `Project.toml` file on the
        // file system and push it in the filesystem.
        this.init()
          .then(() => {
            // Any previous files that were processed would not have attempted
            // a `sendEventsDebounced` because of the lack of a `Project.toml`
            // file.  So now that we've actually parsed this `Project.toml` file
            // and it is in the `projectPipeline`, it is safe to send any
            // buffered events.
            this.sendEventsDebounced(false);
          })
          .catch((e) => {
            console.error(
              `Error initializing file system after initial Project.toml`,
              e
            );
          });
      }
      // Add this `Project.toml` file to the set of affected files.
      chLog("  Processing change to Project.toml");
      processFile(projectKey);
    } else if (rel === "Manifest.toml") {
      // If this is picking up a change in the `Manifest.toml` file, then trigger
      // then add that to the set of affected files.
      chLog("  Processing change to Manifest.toml");
      processFile(manifestKey);
    } else if (
      (rel.startsWith(prefix1) || rel.startsWith(prefix2)) &&
      rel.endsWith(suffix)
    ) {
      // Check if this is a Dyad source file
      // If so, construct the `SourceKey` for it and then add
      // that key to the `AffectedFiles`
      const source = path.relative(sourceFolder, rel);
      const dir = path.dirname(source);
      const mod = dir === "" || dir === "." ? [] : dir.split(path.sep);
      const base = path.basename(source);

      chLog("  Processing change to source file %s", rel);
      processFile(sourceKey(base, mod));
    } else {
      chLog(
        "  Didn't know what to do with %s since it didn't start with %s|%s and end with %s",
        rel,
        prefix1,
        prefix2,
        suffix
      );
    }

    // If we had a `Project.toml` file in the pipeline when this processing
    // was initiated, then send an event back to the `StandardLibraryProvider`,
    // but debounce it so that we don't create lots of unnecessary events.
    if (hasProj) {
      this.sendEventsDebounced(false);
    }
  }
  close() {
    this.watcher.ifJust((watcher) =>
      watcher.close().catch((e) => {
        console.error(`Error closing NodeSyncFileSystem.watcher: `, e);
      })
    );

    super.close();
  }
}
