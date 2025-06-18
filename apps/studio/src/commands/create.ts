import * as vscode from "vscode";
import { commandName } from "../common.js";
import { createLibrary } from "@juliacomputing/dyad-kernel";
import { NodeAsyncFileSystem } from "@juliacomputing/dyad-kernel/node";
import path from "path";

/**
 * This function registers the compile command
 * @param context
 * @param shared
 */
export function registerCreateComponentLibraryCommand(
  context: vscode.ExtensionContext
) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    commandName("create"),
    async (args) => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          cancellable: false,
          title: "Creating Library, please wait...",
        },
        async (progress) => {
          await performCreation(progress);
        }
      );

      console.log("Create arguments: ", args);
    }
  );
  context.subscriptions.push(disposable);
}

const validateLibraryName = new RegExp("^[a-zA-Z]+$");

async function performCreation(
  progress: vscode.Progress<{ message?: string; increment?: number }>
) {
  progress.report({ increment: 0 });

  try {
    // Prompt user for name of library and validate name
    const name = await vscode.window.showInputBox({
      title: "Component library name",
      value: "",
      placeHolder: "should end in 'Components'",
      validateInput: (value: string): string | null => {
        if (value.length < 5) {
          return "Library name must have at least 5 letters in it";
        }
        if (!validateLibraryName.test(value)) {
          return "Library name must contain only letters (upper or lowercase)";
        }
        return null;
      },
    });

    if (name === undefined) {
      await vscode.window.showErrorMessage("No library name provided");
      return;
    }

    progress.report({ increment: 25 });

    // Prompt user for directory to create library in
    let defaultDir: vscode.Uri | undefined = undefined;

    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      defaultDir = folders[0].uri;
    }

    const parentUri = await vscode.window.showOpenDialog({
      title: `Directory in which to create ${name} library`,
      defaultUri: defaultDir,
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    });

    if (parentUri === undefined) {
      await vscode.window.showErrorMessage("No directory selected");
      return;
    }

    const dir = path.join(parentUri[0].fsPath, name);

    if (dir === undefined) {
      await vscode.window.showErrorMessage("No directory provided");
      return;
    }

    progress.report({ increment: 50 });

    // Create library
    const start = performance.now();
    const fs = new NodeAsyncFileSystem(dir, []);
    await createLibrary(name, fs, ".", { name: "", email: "" });
    const created = performance.now();
    console.log(
      `Call to createLibrary took ${(created - start) / 1000} seconds`
    );

    progress.report({ increment: 75 });

    const updated = performance.now();
    console.log(`Updating settings took ${(updated - created) / 1000} seconds`);

    progress.report({ increment: 75 });

    const dirUri = vscode.Uri.joinPath(parentUri[0], name);

    // Open library in new Window
    vscode.commands
      .executeCommand("vscode.openFolder", dirUri, {
        forceNewWindow: true,
      })
      .then(
        () => {},
        (e) => {
          console.error(e);
        }
      );

    // // THIS DOESN'T REALLY RUN (the compilation at least)...because we open
    // // everything in a separate window.  Need to figure out a fix.
    // progress.report({ increment: 75 });

    // console.log("Library created");

    // // Now compile the code
    // await shared.client.caseOf({
    //   Nothing: async () => {
    //     await vscode.window.showErrorMessage(
    //       `Could not access initialized client`
    //     );
    //   },
    //   Just: async (client) => {
    //     // This sends the compile request to LSP.  This is a custom method but
    //     // we send it to the server because the Workspace is already set up on
    //     // that side.
    //     try {
    //       if (client.isRunning()) {
    //         await client.restart();
    //       }
    //       await triggerCompile(client);
    //     } catch (e) {
    //       console.error(`Error while compiling: `, e);
    //     }
    //   },
    // });
    // console.log("Completed library creation");
    // await vscode.window.showInformationMessage(
    //   `New Dyad Component library "${name}" created and compiled`
    // );
  } catch (e: any) {
    await vscode.window.showErrorMessage(e.message);
  } finally {
    progress.report({ increment: 100 });
  }
}
