import { Either, Left, Right } from "purify-ts/Either";
import { assetKey } from "@juliacomputing/dyad-ast";
import { invalidPath, MissingResource } from "./errors.js";
import { LibraryResources } from "./resources.js";
import { lastValue } from "../providers/last.js";
import { guessContentType } from "./utils.js";
import { Problem, toProblems, uriScheme } from "@juliacomputing/dyad-common";
import { FileEvent } from "../providers/events.js";
import { Observer } from "rxjs";

/**
 * This is the information returned by a successful call to `Workspace.fetch`.
 */
export interface FetchResponse {
  contentType: string;
  contents: ArrayBuffer;
}

export function cacheObserver(
  cache: Map<string, FetchResponse>
): Observer<FileEvent> {
  return {
    next: (fileEvent) => {
      const keys = [
        ...fileEvent.added,
        ...fileEvent.changed,
        ...fileEvent.deleted,
      ];
      for (const key of keys) {
        if (key.kind === "asset") {
          cache.delete(key.file);
        }
      }
    },
    error: () => undefined,
    complete: () => undefined,
  };
}

export async function workspaceFetch(
  url: string,
  libraries: LibraryResources[]
): Promise<Either<Problem, FetchResponse>> {
  try {
    // First parse the URL and see if it is a `dyad://` URL
    const parsed = new URL(url);
    if (parsed.protocol === `${uriScheme}:`) {
      // We use hostname here because `host` includes the _port_ and we don't
      // want that (it doesn't mean anything with this scheme)
      let packageName = parsed.hostname;
      let rest = parsed.pathname.slice(1);
      if (packageName === "") {
        if (parsed.pathname.startsWith("//")) {
          const parts = parsed.pathname.slice(2).split("/");
          packageName = parts[0];
          rest = parts.slice(1).join("/");
        } else {
          return Left(
            new MissingResource(
              url,
              `Found ${uriScheme}: URL without package information: '${url}'`
            )
          );
        }
      }
      // Validate the syntax of the path
      if (!parsed.pathname.startsWith("/")) {
        return Left(
          invalidPath(url, "URL parsing error, expected path to start with '/'")
        );
      }
      // Now find the library with this package name and look for the
      // file in there using an `AssetKey`.
      for (const lib of libraries) {
        const proj = await lastValue(lib.provider.project());
        if (proj.name === packageName) {
          const key = assetKey(rest);
          const contents = await lib.provider.get(key);
          const contentType = guessContentType(rest, contents);
          const response: FetchResponse = {
            contentType,
            contents,
          };

          return Right(response);
        }
      }
      return Left(
        new MissingResource(
          url,
          `Package ${packageName} contains no asset named ${rest}`
        )
      );
    } else {
      const resp = await fetch(url);
      const headers = resp.headers;
      const contentType =
        headers.get("Content-Type") ?? "application/octet-stream";
      const contents = await resp.arrayBuffer();
      return Right({ contentType, contents });
    }
  } catch (e) {
    const problems = toProblems(e);
    return Left(problems[0]);
  }
}

export function generateAssetLink(library: string, filename: string) {
  return `dyad://${library}/${filename}`;
}
