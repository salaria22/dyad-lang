import * as vscode from "vscode";

export const FLATTENED_COMPONENT_SCHEME = "dyad-flattened";
export const FLATTENED_COMPONENT_URI = vscode.Uri.parse(
  `${FLATTENED_COMPONENT_SCHEME}:/Flattened Component.dyad`
);

// Simple in-memory store for the content
let flattenedComponentContent = "";

export class FlattenedComponentProvider
  implements vscode.FileSystemProvider
{
  // --- manage content ---
  public static setContent(content: string): void {
    flattenedComponentContent = content;
    // Notify VS Code that the content of the URI has changed.
    this._eventEmitter.fire([
      { type: vscode.FileChangeType.Changed, uri: FLATTENED_COMPONENT_URI },
    ]);
  }

  // --- manage file events ---
  private static readonly _eventEmitter =
    new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  public readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
    FlattenedComponentProvider._eventEmitter.event;

  public watch(
    _uri: vscode.Uri,
    _options: { recursive: boolean; excludes: string[] }
  ): vscode.Disposable {
    // For this simple read-only provider, watching isn't really necessary
    // as changes are pushed via setContent.
    return new vscode.Disposable(() => {});
  }

  // --- read file metadata ---
  public stat(uri: vscode.Uri): vscode.FileStat {
    if (uri.toString() === FLATTENED_COMPONENT_URI.toString()) {
      return {
        type: vscode.FileType.File,
        ctime: Date.now(),
        mtime: Date.now(),
        size: flattenedComponentContent.length,
      };
    }
    throw vscode.FileSystemError.FileNotFound(uri);
  }

  // --- read file contents ---
  public async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.toString() === FLATTENED_COMPONENT_URI.toString()) {
      return new TextEncoder().encode(flattenedComponentContent);
    }
    throw vscode.FileSystemError.FileNotFound(uri);
  }

  // --- write file contents (disabled for read-only) ---
  public async writeFile(
    _uri: vscode.Uri,
    _content: Uint8Array,
    _options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    // This provider is read-only.
    throw vscode.FileSystemError.NoPermissions(
      "Cannot save a flattened component view."
    );
  }

  // --- other FileSystemProvider methods (not implemented) ---
  public async readDirectory(
    _uri: vscode.Uri
  ): Promise<[string, vscode.FileType][]> {
    throw vscode.FileSystemError.FileNotFound(
      "This provider does not support directories."
    );
  }

  public async createDirectory(_uri: vscode.Uri): Promise<void> {
    throw vscode.FileSystemError.NoPermissions(
      "This provider does not support creating directories."
    );
  }

  public async delete(
    _uri: vscode.Uri,
    _options: { recursive: boolean }
  ): Promise<void> {
    throw vscode.FileSystemError.NoPermissions(
      "This provider does not support deleting."
    );
  }

  public async rename(
    _oldUri: vscode.Uri,
    _newUri: vscode.Uri,
    _options: { overwrite: boolean }
  ): Promise<void> {
    throw vscode.FileSystemError.NoPermissions(
      "This provider does not support renaming."
    );
  }
} 