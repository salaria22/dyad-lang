import { ProviderKey } from "./keys.js";

export interface MKDirOptions {
  mode?: number;
  recursive?: boolean;
}

export interface WriteFileOptions {
  mode: number;
  encoding?: string;
  providerKey?: ProviderKey; // May be provided if called from the standard library provider
}

export interface ReadFileOptions {
  encoding?: string;
  providerKey?: ProviderKey; // May be provided if called from the standard library provider
}

export interface ReadDirOptions {}

export interface RMDirOptions {
  providerKey?: ProviderKey; // May be provided if called from the standard library provider
}

export interface UnlinkOptions {
  providerKey?: ProviderKey; // May be provided if called from the standard library provider
}

export interface ExistsOptions {
  /**
   * If `type` is specified then the function should only return true if the
   * path not only exists but is of the specific type listed below.
   */
  type?: "file" | "directory";
}

export interface FileSystemInterface {
  mkdir(filepath: string, options?: MKDirOptions): Promise<void>;
  rmdir(filepath: string, options?: RMDirOptions): Promise<void>;
  readdir(filepath: string, options?: ReadDirOptions): Promise<string[]>;
  writeFile(
    filepath: string,
    data: string | Uint8Array,
    options?: WriteFileOptions
  ): Promise<void>;
  readFile(
    filepath: string,
    options?: ReadFileOptions
  ): Promise<string | Uint8Array>;
  unlink(filepath: string, options?: UnlinkOptions): Promise<void>;
  rename(oldFilepath: string, newFilepath: string): Promise<void>;
  exists(filename: string, options?: ExistsOptions): Promise<boolean>;
}

/**
 * This is the functionality required by the `StandardLibraryProvider`
 */
export type MinimalFileSystemInterface = Pick<
  FileSystemInterface,
  "exists" | "readdir" | "readFile" | "writeFile" | "unlink"
>;
