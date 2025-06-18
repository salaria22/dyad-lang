import { FileContents, SourceKey } from "@juliacomputing/dyad-ast";
import {
  FileEntity,
  Selector,
  Workspace,
  fileEntity,
  getFileRelations,
  getLibraryNode,
  queryFile,
  queryLibrary,
  queryModule,
} from "@juliacomputing/dyad-kernel";
import { Just, Maybe, Nothing } from "purify-ts";
import { SharedExtensionVariables } from "./shared.js";
import { URI } from "vscode-uri";
import { NodeAsyncFileSystem } from "@juliacomputing/dyad-kernel/node";
import {
  failedResult,
  problemError,
  Result,
  sourceFolder,
  successfulResult,
} from "@juliacomputing/dyad-common";

import debug from "debug";

const contextLog = debug("context:documents");

/** Information we want to associated with each document */
export interface DocumentContext {
  key: SourceKey;
  libraryName: string;
  contents: FileContents;
  workspace: Workspace;
  provider: NodeAsyncFileSystem;
  filename: string;
  entity: FileEntity;
  selector: Selector<Maybe<FileContents>>;
}

export function uriFilename(uri: string): Maybe<string> {
  const parts = URI.parse(uri);
  if (parts["scheme"] === "file" && parts.fsPath !== null) {
    const filename = parts.fsPath;
    return Just(filename);
  }
  return Nothing;
}

export const unknownProvider = problemError(
  "unknown-provider",
  "Unknown provider"
);

/**
 * Identify the path of a given `FileContents` node.
 * @param shared
 * @param workspace
 * @param node
 * @returns
 */
export function keyToPath(
  shared: SharedExtensionVariables,
  node: FileContents
): Selector<Result<string>> {
  return ({ query }) => {
    const rels = query(getFileRelations(node));
    const lib = query(getLibraryNode(rels.library));
    return lib.chain((lib): Result<string> => {
      const provider = shared.libraryProviders[lib.name];
      if (!provider) {
        return failedResult(
          unknownProvider(
            lib.name,
            `Unable to find provider for library ${lib.name}`
          )
        );
      }
      return successfulResult(provider.path(node.source));
    });
  };
}

function chainMerge<T extends Object, U, R extends Object>(
  x: T,
  r: Maybe<U>,
  f: (x: U) => R
): Maybe<T & R> {
  return r.map((u) => ({ ...x, ...f(u) }));
}

/**
 * This function strips the prefix string from `str` and then takes
 * the result and splits it by `/`.
 *
 * @param str
 * @param prefix
 * @returns
 */
function stripPrefixAndSplit(str: string, prefix: string): string[] {
  const stripped = str.slice(prefix.length + 1);
  return stripped.split("/");
}

/**
 * This method takes a document URI and compiles a whole bunch of Workspace
 * context information.
 **/
export function getContext(
  fileUri: string,
  shared: SharedExtensionVariables
): Maybe<DocumentContext> {
  return shared.workspace
    .map((workspace) => ({ workspace }))
    .chain((v) =>
      chainMerge(v, uriFilename(fileUri), (filename) => ({ filename }))
    )
    .chain(({ workspace, filename }) => {
      for (const [libraryName, dir] of Object.entries(
        shared.libraryDirectories
      )) {
        const provider = shared.libraryProviders[libraryName];
        if (filename.startsWith(dir)) {
          // Remove dir from path
          const rel = filename.slice(dir.length + 1);
          const libq = workspace.query(queryLibrary(libraryName));
          contextLog("dir = %s, rel = %s", dir, rel);
          const prefix = sourceFolder;
          if (libq.isJust() && rel.startsWith(prefix)) {
            const pieces = stripPrefixAndSplit(rel, prefix);
            contextLog("pieces = %j", pieces);
            const modulePath = pieces.slice(0, pieces.length - 1);
            const modq = workspace.query(queryModule(libraryName, modulePath));
            if (modq.isJust()) {
              const module = modq.unsafeCoerce();
              for (const contents of module.files) {
                const key = contents.source;
                if (key.kind === "src" && key.file === pieces.at(-1)) {
                  const selector = queryFile(libraryName, key);
                  const entity = fileEntity(libraryName, key.mod, key.file);
                  return Just({
                    key,
                    libraryName,
                    module,
                    contents,
                    provider,
                    workspace,
                    filename,
                    entity,
                    selector,
                  });
                }
              }
              contextLog(
                "Filename %s not found in module %s",
                filename,
                modulePath
              );
            } else {
              contextLog("modq.isJust() = %j", modq.isJust());
            }
          } else {
            contextLog(
              "libq.isJust() = %j and rel.startsWith('/%s') = %j (rel=%s, dir=%s)",
              libq.isJust(),
              prefix,
              rel.startsWith(prefix),
              rel,
              dir
            );
          }
        } else {
          contextLog("Document %s doesn't start with %s", filename, dir);
        }
      }
      return Nothing;
    });
}
