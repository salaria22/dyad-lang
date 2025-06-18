import { ProviderKey } from "./keys.js";

export type TransactionId = string;

export interface AffectedFiles {
  added: ProviderKey[];
  changed: ProviderKey[];
  deleted: ProviderKey[];
}

/**
 * This event is published whenever a file system registers the addition,
 * deletion or modification of a file.
 */
export interface FileEvent extends AffectedFiles {
  kind: "file";
  /** UUID of the provider who manages these files */
  uuid: string;
  /** Name of the provider/library that these files belong to */
  name: string;
  /** Version of the library */
  version: string;
  /** Transaction ID associated with this file change */
  transactionId: TransactionId;
  /** Date that this event occurred */
  date: Date;
  /** Indicates that the workspace can skip re-parsing */
  skipReparse: boolean;
}

/**
 * An instance of this structure is returned by any operation that mutates the
 * underlying files.  The goal here is to be able to determine if a given
 * operation truly mutated the file system (which will lead to some updates) and
 * to provide version information so it is possible to determine when the
 * updates that result from this transaction have been completed.
 */
export interface LibraryEvent {
  kind: "lib";
  /** Did this transaction mutate the file system */
  mutated: boolean;
  /** What version is the provider at after this transaction was applied */
  version: string;
  /** A transaction id */
  transactionId: TransactionId;
}

export interface WriteResponse {
  mutated: boolean;
  version: string;
  transactionId: TransactionId;
}
