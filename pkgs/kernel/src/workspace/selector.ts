import { WorkspaceNode } from "@juliacomputing/dyad-ast";
import { Attributes } from "./attributes/attributes.js";
import { FetchResponse } from "./fetch.js";
import { Result } from "@juliacomputing/dyad-common";

export type QueryHandler = <T>(s: Selector<T>) => T;
export type FetchHandler = (url: string) => Result<FetchResponse>;

export interface SelectorResources {
  root: WorkspaceNode;
  attrs: Attributes;
  query: QueryHandler;
  fetch: FetchHandler;
}

export type Selector<T> = (res: SelectorResources) => T;
export type Mutator<T> = (draft: T) => void;

export const workspaceSelector: Selector<WorkspaceNode> = ({ root }) => root;
