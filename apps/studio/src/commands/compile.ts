import * as vscode from "vscode";
import { commandName } from "../common.js";
import { SharedClientInformation } from "../shared.js";
import { LanguageClient, RequestType } from "vscode-languageclient/node";
import {
  CompileRequestParams,
  CompileResponseParams,
  compileMethod,
} from "../requestDefinitions/compile.js";

const compileType = new RequestType<
  CompileRequestParams,
  CompileResponseParams,
  void
>(compileMethod);

/**
 * This function registers the compile command
 * @param context
 * @param shared
 */
export function registerCompileCommand(
  context: vscode.ExtensionContext,
  shared: SharedClientInformation
) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    commandName("compile"),
    async (args) => {
      console.log("Compile arguments: ", args);
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
            await triggerCompile(client);
          } catch (e) {
            console.error(`Error while compiling: `, e);
          }
        },
      });
    }
  );
  context.subscriptions.push(disposable);

  // An example of how to create a hover text.  No idea how to
  // make this conditional.  What I need is something more like how
  // Jest or Go tests are handled, but I don't know what that UI element
  // is called (yet).
  //
  // Note how the arguments can be URI encoded (e.g., ideally current
  // file could be included so we could compile just the current module
  // and not every module in every library).

  // vscode.languages.registerHoverProvider(
  //   "dyad",
  //   new (class implements vscode.HoverProvider {
  //     provideHover(
  //       document: vscode.TextDocument,
  //       _position: vscode.Position,
  //       _token: vscode.CancellationToken
  //     ): vscode.ProviderResult<vscode.Hover> {
  //       const args = { documentUri: document.uri };
  //       const commentCommandUri = vscode.Uri.parse(
  //         `command:dyad-studio.compile?${encodeURIComponent(
  //           JSON.stringify(args)
  //         )}`
  //       );
  //       const contents = new vscode.MarkdownString(
  //         `[Add comment](${commentCommandUri})`
  //       );

  //       // To enable command URIs in Markdown content, you must set the `isTrusted` flag.
  //       // When creating trusted Markdown string, make sure to properly sanitize all the
  //       // input content so that only expected command URIs can be executed
  //       contents.isTrusted = true;

  //       return new vscode.Hover(contents);
  //     }
  //   })()
  // );
}

export async function triggerCompile(client: LanguageClient) {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: false,
      title: "Dyad: compiling, please wait...",
    },
    async (progress) => {
      progress.report({ message: "starting compilation", increment: 10 });
      try {
        const result = await client.sendRequest(compileType, {});
        progress.report({
          message: "compilation results received",
          increment: 90,
        });
        const entries = Object.entries(result.failures);

        if (entries.length > 0) {
          const msg = `Compilation issues: ${entries
            .map(([lib, reason]) => `${lib}: ${reason}`)
            .join(",")}`;
          await vscode.window.showErrorMessage(msg);
        }
      } finally {
        progress.report({ message: "compilation completed", increment: 100 });
      }
    }
  );
}
