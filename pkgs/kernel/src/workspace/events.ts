import { FileEvent, LibraryEvent, TransactionId } from "../providers/index.js";
import { nanoid } from "nanoid";

/**
 * This event occurs when there are changes to the AST.  An "external" event
 * corresponds to a change made from _outside_ the workspace. External events
 * are generally a result of a change in the underlying file system of the
 * provider.  An "internal" event is one that originated from within the
 * `Workspace`.  Such events are an indication that a change made within the
 * `Workspace` has been committed _to_ the underlying filesystem.
 */
export interface ProcessingEvent {
  kind: "external" | "internal";
  transactionId: TransactionId[];
  updateChecks: boolean;
}

export function externalEvent(
  ids: string[] | null,
  updateChecks: boolean
): ProcessingEvent {
  return {
    kind: "external",
    transactionId: ids ?? [`ext-event-${nanoid()}`],
    updateChecks,
  };
}

export function internalEvent(e: ProcessingEvent): ProcessingEvent {
  return { ...e, kind: "internal" };
}

/**
 * These are the types of events we may see.
 */
export type WorkspaceEvent = FileEvent | LibraryEvent | ProcessingEvent;

export function logEntry(e: ProcessingEvent): ProcessingEvent {
  return {
    kind: e.kind,
    transactionId: e.transactionId,
    updateChecks: e.updateChecks,
  };
}

export interface ModificationEntry {
  skipReparse: boolean;
  debounce: boolean;
}
