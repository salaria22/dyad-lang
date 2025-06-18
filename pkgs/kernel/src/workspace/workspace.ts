import { Either } from "purify-ts/Either";
import {
  FileEvent,
  LibraryProvider,
  InMemoryLibraryProvider,
} from "../providers/index.js";
import { Observable } from "rxjs/internal/Observable";
import {
  baseLibraryName,
  failedResult,
  Problem,
  Result,
  str2buf,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  WorkspaceNode,
  sourceKey,
  assetKey,
  Expression,
  Definition,
  RawFile,
  ParsedFile,
  isFileContents,
} from "@juliacomputing/dyad-ast";
import {
  ReplaySubject,
  distinct,
  filter,
  firstValueFrom,
  mergeMap,
  tap,
} from "rxjs";
import { Attributes } from "./attributes/index.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { Selector, Mutator, SelectorResources } from "./selector.js";
import { nanoid } from "nanoid";
import { baseAssets, baseContents, baseUUID } from "./base.js";
import {
  MissingResource,
  NoFile,
  NoProvider,
  WriteBackFailure,
} from "./errors.js";
import { ResolvedType } from "./types/index.js";
import { LibraryResources } from "./resources.js";
import { cacheObserver, FetchResponse, workspaceFetch } from "./fetch.js";
import { ProcessingEvent, externalEvent } from "./events.js";
import { FollowOptions, ModifyOptions } from "./options.js";
import { handleFileEvents } from "./file_events.js";
import { registerProvider } from "./register.js";
import { Transaction } from "./transaction.js";
import { resolveExpressionType } from "./types/expression.js";
import { Mutex } from "async-mutex";
import {
  autorun,
  makeAutoObservable,
  observable,
  ObservableMap,
  toJS,
} from "mobx";
import { FileEntity } from "./entities/files.js";
import { DefinitionEntity } from "./entities/index.js";
import { castOrThrow } from "../flow.js";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import debug from "debug";
import { defaultIconURI } from "../metadata/default_icons.js";
import { guessContentType, stringifyProblem } from "./utils.js";
import { getFileNode } from "./selectors/nodes.js";

const eventLog = debug("events:workspace");
const cacheLog = debug("cache:workspace");

export type CommitCallback = () => Promise<void>;

export type ModifiableNode = Definition | ParsedFile | RawFile;
export type ModifiableEntity = DefinitionEntity | FileEntity;

const enableDebugTree = false;

export class Workspace {
  public static async create(): Promise<Workspace> {
    const ret = new Workspace();
    const base = new InMemoryLibraryProvider({
      name: baseLibraryName,
      uuid: baseUUID,
      authors: [],
      version: "0.1.0",
    });

    await base.initializeFilesystem();

    // Install the text of this package
    await base.set(sourceKey("base.dyad", []), baseContents);

    for (const [key, contents] of Object.entries(baseAssets)) {
      const buf = str2buf(contents);
      ret.resourceCache.set(`dyad://${baseLibraryName}/${key}`, {
        contentType: guessContentType(key, buf),
        contents: buf,
      });
      await base.set(assetKey(key), contents);
    }

    await ret.fetch(defaultIconURI);

    // Now register this package
    const id = await ret.registerProvider(base);
    // Wait for Dyad library to be loaded
    await ret.waitForId(id);

    base.setReadonly(true);

    return ret;
  }

  /**
   * This is a collection of library resources (including provider)
   */
  private libraries: LibraryResources[];
  /**
   * A counter that is incremented each time the workspace is mutated
   */
  private version: number = 0;
  /**
   * A sequence of file events
   */
  private events: ReplaySubject<FileEvent>;

  /**
   * This the current (observable) AST for the entire workspace.
   * This will be observed by `mobx` and manipulated by various
   * `Workspace` methods.
   */
  protected observableTree: WorkspaceNode;

  /**
   *
   */
  private debugTree: WorkspaceNode;

  /**
   * A stream of processed transaction ids.  This replay subject
   * is initialized to hold these transaction ids for a limited
   * amount of time (enough time for anybody interested in them
   * to subscribe).
   */
  private transactionLog: ReplaySubject<ProcessingEvent>;

  /**
   * All attributes (inherited, synthetic, global, lazy) are all contained
   * in this class.
   */
  private attrs: Attributes;

  private sources: SelectorResources;
  /**
   * This mutex is used to prevent any transactions being performed while
   * running the code generator (among other things).
   */
  private mutex: Mutex = new Mutex();

  /**
   * A cache to store assets (so we don't need to ask the provider
   * for them repeatedly.
   *
   * NB - The key here is the `file` value from the `AssetKey` and **not** the URL
   * of the fetched resource.  This will make invalidation much easier.
   **/
  private resourceCache: ObservableMap<string, FetchResponse>;

  private constructor() {
    this.resourceCache = observable.map(new Map<string, FetchResponse>());
    this.observableTree = makeAutoObservable(
      { kind: "workspace", libraries: [] },
      undefined,
      { deep: true }
    );

    this.debugTree = toJS(this.observableTree);
    if (enableDebugTree) {
      autorun(() => {
        this.debugTree = toJS(this.observableTree);
      });
    }

    this.attrs = new Attributes(this.query.bind(this));
    // No library providers to start with
    this.libraries = [];

    const fetch = (url: string): Result<FetchResponse> => {
      const cached = this.resourceCache.get(url);
      if (cached !== undefined) {
        cacheLog("Cache hit for %s", url);
        return successfulResult(cached);
      }
      cacheLog(
        "Resource %s was not pre-fetch, pre-fetched URLs include: %j",
        url,
        this.resourceCache.keys()
      );
      this.fetch(url)
        .then(() => {
          cacheLog(
            "Previously initiated fetch of %s succeeded, should now be in cache and observers notified"
          );
        })
        .catch((e) => {
          cacheLog("Previously initiated fetch of %s failed: %s", e.message);
        });
      cacheLog(
        "Fetch of %s initiated, but FetchResponse cannot be provided synchronously"
      );
      return failedResult(
        new MissingResource(url, `Resource ${url} (not yet loaded into cache)`)
      );
    };

    this.sources = {
      root: this.observableTree,
      attrs: this.attrs,
      query: this.query.bind(this),
      fetch,
    };

    // A place to merge file events from all providers
    this.events = new ReplaySubject(1);

    // Used to broadcast when file events have been processed.  Note that this
    // buffers all transactions for one second.  This is plenty of time to
    // attach a `.takeUntil` or similar.
    this.transactionLog = new ReplaySubject(undefined, 1000);

    this.transactionLog.subscribe((v) =>
      eventLog(
        "%s << %s event logged in transaction log",
        v.transactionId,
        v.kind
      )
    );

    /** Process file events (one at a time) into processing events */
    this.events
      .pipe(
        tap((ev) => {
          eventLog("-- %s: Workspace received event", ev.transactionId);
        }),
        // First, invalidate any caches impacted by the files associated
        // with this event
        tap(cacheObserver(this.resourceCache)),
        // If any files have changed as a result of this event, bump
        // the version number.
        tap((ev) => {
          if (
            ev.added.length > 0 ||
            ev.changed.length > 0 ||
            ev.deleted.length > 0
          ) {
            this.version++;
          }
        }),
        // Then check if this event can skip file processing
        filter((event) => !event.skipReparse),
        // If not, perform the file processing.  When processing is done, the
        // promise it returns is converted into an observable and the result of
        // that promise is injected into this stream
        tap((ev) => {
          eventLog("-- %s: Passing to file event processing", ev.transactionId);
        }),
        // TODO I think this event is leaking through before processing is done?!?
        mergeMap((ev) => this.runExclusively(() => this.processFileEvents(ev))),
        tap((ev) => {
          eventLog("<< %s: Completed processing file event", ev.transactionId);
        })
      )
      // Finally, log that the transaction is complete
      .subscribe({
        next: (ev) => {
          eventLog("<< %s: Transaction done", ev.transactionId);
          this.transactionLog.next(ev);
        },
        error: (e) => {
          console.error(
            "There was an error in the transaction log, event pipeline is shutting down"
          );
          console.error(e);
          eventLog("<< %s: Transaction error", e.message);
          this.transactionLog.error(e);
        },
        complete: () => {
          eventLog("Transaction complete");
          this.transactionLog.complete();
        },
      });

    // Give this replay subject an initial value
    const initPreEvent = externalEvent([`init-ext-event-${nanoid()}`], true);
    this.transactionLog.next(initPreEvent);
  }

  private async handleWhenAble<T>(f: () => Promise<T>): Promise<T> {
    if (globalThis.window === globalThis) {
      return await new Promise((resolve, reject) => {
        globalThis.window.requestIdleCallback(
          () => {
            f().then(resolve, reject);
          },
          { timeout: 500 }
        );
      });
    } else {
      return await f();
    }
  }

  private async processFileEvents(event: FileEvent): Promise<ProcessingEvent> {
    const prefetch = async (url: string) => {
      cacheLog(
        "Request to pre-fetch %s, currently contains: %j",
        url,
        this.resourceCache.keys()
      );
      this.resourceCache.delete(url);
      const resp = await this.fetch(url);
      resp.caseOf({
        Left: (v) => {
          cacheLog("Couldn't prefetch %s: %s", url, stringifyProblem(v));
        },
        Right: () => {
          cacheLog("Successfully pre-fetched %s", url);
        },
      });
    };
    return this.handleWhenAble(async () => {
      const ret = await handleFileEvents(
        event,
        this.observableTree,
        this.libraries,
        prefetch
      );
      return ret;
    });
  }

  /**
   * Get the current version of the library.  The semantics of this version are
   * that any change to the library _must_ trigger a change in version.
   * Conversely, if the version has not changed, then no change could have been
   * made to the library.
   */
  getVersion() {
    return this.version;
  }

  public async runExclusively<T>(f: () => T | Promise<T>): Promise<T> {
    const ret = await this.mutex.runExclusive(async () => {
      return await f();
    });
    return ret;
  }

  /**
   * This method waits until a given transaction has been processed. This is
   * useful in testing but may prove useful as well in other cases where we
   * simply want to ensure that a given change has been fully processed.
   */
  async waitForId(transactionId: string): Promise<void> {
    eventLog("?? %s: Waiting for id", transactionId);
    const foo = this.transactionLog.pipe(
      filter((e) => e.transactionId.includes(transactionId))
    );
    const entry = await firstValueFrom(foo);
    eventLog("!! %s: Found transaction: %j", transactionId, entry);
  }

  /**
   * Get a library provider by its uuid
   *
   * @param id UUID of the requested library provider
   */
  getProvider(id: string): Maybe<LibraryProvider> {
    for (const entry of this.libraries) {
      if (entry.uuid === id) {
        return Just(entry.provider);
      }
    }
    return Nothing;
  }

  /**
   * Register a given provider
   *
   * @param provider
   * @returns The transaction id associated with connecting this library
   */
  async registerProvider(provider: LibraryProvider): Promise<string> {
    return registerProvider(provider, this.libraries, this.events);
  }

  /**
   * Determine the type of a given expression in a given context.  This walks the
   * expression tree and resolves the type of each node in the tree and accumulates
   * any errors or warnings in the `Result`.
   *
   * @param expr
   * @param context
   * @returns
   */
  resolveExpressionType(
    expr: Expression,
    context: Definition
  ): Result<ResolvedType> {
    return resolveExpressionType(expr, context, this);
  }

  /**
   * This function returns an observable of the transaction log.  This could
   * probably be made private, I don't think clients really need this.  The
   * main use case is already handled by `waitForId`.
   */
  queryTransactionLog(): Observable<ProcessingEvent> {
    return this.transactionLog;
  }

  /**
   * This function takes a selector, runs it once on the current _annotated_
   * root node and returns the result.  If you want your selector results to be
   * kept "up to date" any time the AST changes, you want `follow`.
   * @param s
   * @returns The current result of the selector processing
   */
  query<T>(s: Selector<T>): T {
    return s(this.sources);
  }

  /**
   * This function takes a selector and runs it for the current _annotated_ root
   * node (since that is stored by a `ReplaySubject`) **and** any time the root
   * node is updated.  Note that if the `unique` flag is set (and it is set by
   * default) this runs a `distinct` filter on the output of the Selector so it
   * only yields new results when the result of the Selector changes.
   *
   * @param s
   * @param unique
   * @returns
   */
  follow<T>(s: Selector<T>, options?: FollowOptions): Observable<T> {
    const duplicates = options?.duplicates ?? false;
    const obs = new Observable<T>((obs) => {
      const auto = autorun(() => {
        try {
          const val = this.query(s);
          obs.next(val);
        } catch (e) {
          obs.error(e);
        } finally {
        }
      });
      return auto;
    });
    if (duplicates) {
      return obs;
    }
    return obs.pipe(distinct());
  }

  /**
   * This function will rewrite the file that the `ASTNode` referred to by `path`
   * is contained in.  It turns the transaction id of the operation
   * that writes out the file.
   *
   * @param path
   * @param skipReparse
   * @returns
   */
  private async updateFile(
    path: FileEntity,
    skipReparse: boolean
  ): Promise<void> {
    const filenode = this.query(getFileNode(path, isFileContents));

    if (!filenode.hasValue()) {
      throw new NoFile(
        path,
        `Cannot modify node '${path}', it has no ParsedFile ancestor associated with it`
      );
    }

    const file = filenode.value;

    const provider = castOrThrow(
      this.getProvider(file.provider),
      new NoProvider(
        path,
        `Cannot modify node '${path}', it has no library provider associated with it`
      )
    );

    try {
      // Now get the new ParsedFile node for the file we just modified (we need
      // to rerun lodash.get because the tree itself has been mutated but the
      // path to the file should not have changed).
      const source = unparseDyad(file);

      const id = (
        await provider.set(file.source, source, {
          skipReparse: skipReparse,
        })
      ).transactionId;
      if (!skipReparse) {
        // We only do this if the files will be reparsed because if they are not
        // reparsed there will be no update to the annotatedTree (which is what
        // this is waiting to see)
        await this.waitForId(id);
      }
    } catch (e: any) {
      console.error(
        `Error writing file '${
          file.source.file
        }' in module '${file.source.mod.join(
          "/"
        )}' to provider ${provider.uuid()} (type: ${provider.type()}): ${
          e.message
        }`
      );
      console.error(e);
      throw new WriteBackFailure(file.source.file, e.message);
    }
  }

  /**
   * Create a new `Transaction` instance for this `Workspace`
   * @param options
   * @returns
   */
  transaction(_options?: ModifyOptions): Transaction {
    // We need to think about how we will commit transactions in a MobX
    // context.  But it should be straightforward (but different than the
    // old way).
    const updateFiles = async (files: FileEntity[]) => {
      const updates = files.map((file) => this.updateFile(file, true));
      // Note, we can skip the re-parsing because we know that when the
      // transaction is committed it is writing back unparsed files.  So
      // re-parsing them won't change the AST.
      await Promise.all(updates);
    };
    return new Transaction(this, updateFiles);
  }

  /**
   * Use this method if you have an AST Node and you want to modify anything
   * about it or its children.
   *
   * @param node The node you which to modify
   * @param f A function which performs the modification
   * @returns the transaction id that indicates semantic processing of the new
   * tree has been completed.
   */
  modify<T extends ModifiableNode>(
    node: T,
    f: Mutator<T>,
    options?: ModifyOptions
  ): Promise<void> {
    const txn = this.transaction(options);
    txn.modify(node, f);
    const p = txn.commit();
    return p.catch((e) => {
      console.error(`Error while performing modify: `, e);
    });
  }

  /**
   * Returns the root of the current AST.  If `raw` is true this returns the raw
   * tree (which is not necessarily annotated).  If `raw` is false (which is the
   * default) the the node returned is the root of an annotated tree.
   *
   * @param raw
   * @returns
   */
  getRoot(): WorkspaceNode {
    return this.observableTree;
  }

  /**
   * This method fetches the resource from the specified `url`.  This method
   * is different from the built-in `fetch` function because it understands
   * the `dyad://` scheme for accessing files in the `assets` folder.
   *
   * This method **does not** check the resource cache.  It **always** fetches
   * the requested resource but it will **set** the resource cache if it gets
   * a successful result.
   *
   * @param url
   * @returns The data and content type associated with the fetched file.
   */
  async fetch(url: string): Promise<Either<Problem, FetchResponse>> {
    const resp = await workspaceFetch(url, this.libraries);
    resp.ifRight((fr) => {
      cacheLog("Fetch of %s was successful, FetchResponse stored in cache");
      this.resourceCache.set(url, fr);
    });
    return resp;
  }

  /**
   * This closes down the workspace.  This signals all providers to close down
   * and then completes all the different observables.  It makes me nervous
   * making this synchronous because a) it doesn't really provide complete
   * feedback to the client on the success of the shutdown and b) it seems like
   * it could be the source of some of the race conditions I'm seeing during
   * testing.
   */
  close() {
    for (const resources of this.libraries) {
      resources.provider.close();
    }
    this.events.complete();
    this.transactionLog.complete();
    this.attrs.close();
    eventLog(
      "Workspace.close() called, Completed both events and transaction log"
    );
  }
}
