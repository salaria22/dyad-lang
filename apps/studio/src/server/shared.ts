import { Workspace } from "@juliacomputing/dyad-kernel";
import { Maybe } from "purify-ts";
import { ReplaySubject } from "rxjs";
import { NodeAsyncFileSystem } from "@juliacomputing/dyad-kernel/node";

export type TaskHandler = <T>(f: () => Promise<T>, desc: string) => Promise<T>;

export interface SharedExtensionVariables {
  queue: TaskHandler;
  workspace: Maybe<Workspace>;
  workspaceObservable: ReplaySubject<Workspace>;
  /** This maps a given library to a directory on the filesystem */
  libraryDirectories: Record<string, string>;
  libraryProviders: Record<string, NodeAsyncFileSystem>;
  libraryStatus: Record<string, "dep" | "dev">;
}
