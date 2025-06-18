import * as vscode from "vscode";
import { commandName } from "../common.js";
import { SharedClientInformation } from "../shared.js";

/**
 * This function registers the compile command
 * @param context
 * @param shared
 */
export function registerRestartCommand(
  context: vscode.ExtensionContext,
  shared: SharedClientInformation
) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    commandName("restart"),
    async (args) => {
      console.log("Compile arguments: ", args);
      // The code you place here will be executed every time your command is executed

      await shared.client.caseOf({
        Nothing: async () => {
          await vscode.window.showInformationMessage(`Client not yet started`);
        },
        Just: async (client) => {
          try {
            await client.restart();
          } catch (e) {
            console.error(`Error while restarting: `, e);
          }
        },
      });
    }
  );
  context.subscriptions.push(disposable);
}
