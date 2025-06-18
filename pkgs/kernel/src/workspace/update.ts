import {
  WorkspaceNode,
  findModule,
  addModule,
  sameKey,
  DyadModule,
  FileContents,
  dyadLibrary,
  DyadLibrary,
  rawFile,
} from "@juliacomputing/dyad-ast";
import {
  AstBuilder,
  ParsingResult,
  parseDyad,
} from "@juliacomputing/dyad-parser";
import { FileEvent, LibraryProvider } from "../providers/index.js";

import debug from "debug";
import { buf2str, isObject } from "@juliacomputing/dyad-common";
import { SourceKey } from "@juliacomputing/dyad-ast";
import { CompilerAssertionError } from "./errors.js";
import { runInAction } from "mobx";
import { generateAssetLink } from "./fetch.js";

const updateLog = debug("updates");
const eventLog = debug("events:update");

/**
 * Update abstract syntax tree in response to a file event
 * @param e The event we are responding to
 * @param provider The provider that this event originated from
 * @param observableTree The workspace node we are applying this to
 * @returns
 */
export async function updateAbstractSyntaxTree(
  e: FileEvent,
  provider: LibraryProvider,
  observableTree: WorkspaceNode
): Promise<string[]> {
  const urls = new Set<string>();
  /** Instantiate an ast builder to handle any parsing we may do */
  const builder = new AstBuilder();

  /* The name of the library where this event took place */
  const libname = e.name;

  const libIdx = runInAction(() => {
    /** Find the library where this change took place (it must exist at this point) */
    let libIdx = observableTree.libraries.findIndex(
      (lib) => lib.uuid === e.uuid
    );
    /** Add a library if this library doesn't exist. */
    if (libIdx === -1) {
      libIdx = observableTree.libraries.length;
      const newlib = dyadLibrary(libname, provider.uuid());
      observableTree.libraries.push(newlib);
      updateLog("Added new library named %s (%s)", newlib.name, newlib.uuid);
    }
    return libIdx;
  });

  // This should not happen
  /* istanbul ignore next */
  if (libIdx === -1) {
    throw new CompilerAssertionError(
      libname,
      `Unable to locate library named ${libname}`
    );
  }

  /**
   * Iterate over all added files and make sure (before we go any further) that
   * all referenced modules exist.
   */
  for (const add of e.added) {
    if (add.kind === "src") {
      runInAction(() => {
        addModule(observableTree.libraries[libIdx], add.mod, true);
      });
    }
  }

  // Get the library being referenced
  const lib = observableTree.libraries[libIdx];

  /* istanbul ignore next */
  if (lib === undefined) {
    // NB: This should not happen
    throw new CompilerAssertionError(
      libname,
      `Unable to locate library named ${libname}`
    );
  }

  /** A function that gets a file and parses it. */
  const getContents = async (filekey: SourceKey): Promise<FileContents> => {
    const fileid = instance(provider, filekey);
    const data = await provider.get(filekey);
    const contents = buf2str(data);
    updateLog("Parsing file %s", fileid);
    const res = parseDyad(contents, fileid, filekey);

    // If this assumption is not correct, then we'll have to amend the data
    // structures so we can persist these errors for non-raw files.
    if (
      res.cst !== undefined &&
      (res.lexErrors.length > 0 || res.parseErrors.length > 0)
    ) {
      console.error(
        `Concrete node found in ${fileid} with lex and/or parse errors:`
      );
    }

    /**
     * If we got a concrete syntax tree, then build an abstact syntax tree from
     * it.
     **/
    // If we got a concrete syntax node, then build an
    if (res.cst) {
      updateLog("Successfully parsed %s to a CST", fileid);
      // FIX: pass provider UUID and source key here
      const file = builder.file(res.cst.children, {
        provider: provider.uuid(),
        file: filekey,
      });
      /**
       * In this section we are trying to extract all potential icons
       * to pre-load.
       */
      for (const def of file.definitions) {
        if (def.metadata === null) {
          continue;
        }
        const icons = (def.metadata.value?.Dyad as any)?.icons;
        if (icons === undefined) {
          continue;
        }
        if (isObject(icons)) {
          for (const url of Object.values(icons)) {
            if (typeof url === "string") {
              urls.add(url);
            }
          }
        }
      }
      return file;
    } else {
      return rawFileFromResult(res, provider.uuid(), filekey, fileid, contents);
    }
  };

  /** Ensure this is a library (to narrow the type) */
  /* istanbul ignore next */
  if (lib.kind !== "lib") {
    throw new CompilerAssertionError(
      lib.name,
      "Updates to external model libraries is unimplemented"
    );
  }

  /**
   * Read each added file, parse it and then add it to the library in the
   * appropriate module.
   */
  for (const filekey of e.added) {
    if (filekey.kind === "asset") {
      urls.add(generateAssetLink(lib.name, filekey.file));
    }
    /** We only need to parse this if it was a source file */
    if (filekey.kind === "src") {
      /** Get the module that this should be inserted into. */
      const mod = assertModule(provider, lib, filekey);

      /** Ensure this file doesn't already exist */
      assertStatus(provider, mod, filekey, false);

      /** Fetch the file contents */
      const file_contents = await getContents(filekey);

      const idx = mod.files.findIndex((f) => sameKey(f.source, filekey));

      runInAction(() => {
        if (idx === -1) {
          mod.files.push(file_contents);
        } else {
          // This happens if the `LibraryProvider` reports this as a new file but,
          // in fact, such a file has already been parsed.  In this case, something
          // is going wrong "upstream" somewhere.
          mod.files[idx] = file_contents;
        }
      });
      eventLog("%s: added file %s", e.transactionId, file_contents.source);
    }
  }

  // Read changed files and replace their existing FileContents node
  for (const filekey of e.changed) {
    if (filekey.kind === "asset") {
      urls.add(generateAssetLink(lib.name, filekey.file));
    }
    if (filekey.kind === "src") {
      const file_contents = await getContents(filekey);

      /** Get the module that this should be inserted into. */
      const mod = assertModule(provider, lib, filekey);

      /** Ensure this file does already exist */
      const idx = assertStatus(provider, mod, filekey, true);

      runInAction(() => {
        // Replace the previous AST for this file
        mod.files[idx] = file_contents;
      });
      eventLog("%s: changed file %s", e.transactionId, file_contents.source);
    }
  }

  for (const filekey of e.deleted) {
    if (filekey.kind === "src") {
      /** Get the module that this should be inserted into. */
      const mod = assertModule(provider, lib, filekey);

      /** Ensure this file does already exist */
      const idx = assertStatus(provider, mod, filekey, true);

      runInAction(() => {
        // Remove file at index `idx` for this module
        mod.files.splice(idx, idx);
      });
    }
  }

  eventLog("The following URLs were referenced during the AST update: %j", [
    ...urls,
  ]);
  return [...urls];
}

/**
 * Create a new `RawFile` node from a given result
 * @param res The parsing result
 * @param filekey The filekey of the file that was parsed
 * @param instance The instance string for problems
 * @param contents The contents of the parsed file
 * @returns
 */
function rawFileFromResult(
  res: ParsingResult,
  provider: string,
  filekey: SourceKey,
  instance: string,
  contents: string
) {
  return rawFile(provider, filekey, contents, res.parseErrors);
}

/**
 * Construct an instance string for `Problem`s based on library and filekey
 * @param provider
 * @param filekey
 * @returns
 */
function instance(provider: LibraryProvider, filekey: SourceKey): string {
  return `${provider.uuid()}:.${filekey.mod.join(".")}/${filekey.file}`;
}

/**
 * Extract the module associated with a given file (we assume it exists here, if
 * it doesn't, that is an **compiler** error).
 * @param provider The provider for the library
 * @param lib The library node
 * @param sourcekey The filekey for the source file
 * @returns
 */
function assertModule(
  provider: LibraryProvider,
  lib: DyadLibrary,
  sourcekey: SourceKey
): DyadModule {
  const fileid = instance(provider, sourcekey);
  /** Get the module that this should be inserted into. */
  const mod = findModule(lib, sourcekey.mod);

  /** Ensure the module already exists in our abstract syntax tree (it should!) */
  /* istanbul ignore next */
  if (mod === null) {
    throw new CompilerAssertionError(
      fileid,
      `Expected module ${sourcekey.mod.join("/")} to exist when adding file ${
        sourcekey.file
      }, but it didn't`
    );
  }
  return mod;
}

/**
 * Check to see if any other file in this module already exists with this file
 * key.  If it doesn't match the expected status then that is an error (the
 * upstream event was wrong) and the provider sent us bogus information.
 *
 * TODO: Since event processing may lag behind changes to the file system, this
 * may not always be an error.  Changing to warning for now so we can look at
 * patterns for when this happens.
 **/
function assertStatus(
  provider: LibraryProvider,
  mod: DyadModule,
  filekey: SourceKey,
  shouldExist: boolean
) {
  const idx = mod.files.findIndex((f) => sameKey(f.source, filekey));
  const exists = idx !== -1;
  if (exists && !shouldExist) {
    // Commenting out because we need to really define the semantics here.
    // Does "add" mean that the library provider hasn't seen it before or
    // that it is really new to the file system, for example.
    // console.warn(
    //   `File ${filekey.file} in module '.${filekey.mod.join(
    //     "."
    //   )}' exists even though an event said it was just added (current files are: [${mod.files
    //     .map((f) => f.source.file)
    //     .join(", ")}])`
    // );
  }
  if (!exists && shouldExist) {
    console.warn(
      `File ${filekey.file} in module '.${filekey.mod.join(
        "."
      )}' doesn't exist even though an event said it was just changed or deleted (current files are: [${mod.files
        .map((f) => f.source.file)
        .join(", ")}])`
    );
  }
  return idx;
}
