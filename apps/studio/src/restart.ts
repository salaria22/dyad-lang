import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node.js";
import { potentiallyAutoCompile } from "./extension.js";
import { SharedClientInformation } from "./shared.js";

export function registerRestartHandler(
  client: LanguageClient,
  shared: SharedClientInformation
) {
  console.log("Registering restart handler");
  const watcher = vscode.workspace.createFileSystemWatcher("**/Manifest.toml");
  const handler = async (uri: vscode.Uri) => {
    console.log(
      `Detected a change in ${uri.toString()} file, restarting language server.`
    );
    try {
      await client.restart();
      console.log("Server restarted");
      await potentiallyAutoCompile(client, shared.log);
    } catch (e) {
      console.error(e);
    }
  };
  watcher.onDidChange(handler);
  watcher.onDidCreate(handler);
  watcher.onDidDelete(handler);
  return () => {
    console.log("Watcher disposed of");
    return watcher.dispose();
  };
}
