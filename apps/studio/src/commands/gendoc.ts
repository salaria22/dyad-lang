import * as vscode from "vscode";
import { commandName } from "../common.js";
import { SharedClientInformation } from "../shared.js";
import { LanguageClient, RequestType } from "vscode-languageclient/node";
import {
  GenerateDocumentationRequestParams,
  GenerateDocumentationResponseParams,
  generateDocumentationMethod,
} from "../requestDefinitions/gendoc.js";
import { stringifyProblem } from "@juliacomputing/dyad-kernel";

const generateDocumentationType = new RequestType<
  GenerateDocumentationRequestParams,
  GenerateDocumentationResponseParams,
  void
>(generateDocumentationMethod);

/**
 * This function registers the compile command
 * @param context
 * @param shared
 */
export function registerGenerateDocumentationCommand(
  context: vscode.ExtensionContext,
  shared: SharedClientInformation
) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    commandName("gendoc"),
    async (args) => {
      console.log("Generate documentation arguments: ", args);
      // The code you place here will be executed every time your command is executed

      await shared.client.caseOf({
        Nothing: async () => {
          await vscode.window.showInformationMessage(
            `Could not access initialized client`
          );
        },
        Just: async (client) => {
          // This sends the compile request to LSP.  This is a custom method but
          // we send it to the server because the Workspace is already set up on
          // that side.
          try {
            await triggerDocumentationGeneration(client);
          } catch (e) {
            console.error(`Error while compiling: `, e);
          }
        },
      });
    }
  );
  context.subscriptions.push(disposable);
}

export async function triggerDocumentationGeneration(client: LanguageClient) {
  const result = await client.sendRequest(generateDocumentationType, {});

  if (result.problems.length > 0) {
    const msg = `Compilation issues: ${result.problems
      .map(stringifyProblem)
      .join(",")}`;
    await vscode.window.showInformationMessage(msg);
  }
}
