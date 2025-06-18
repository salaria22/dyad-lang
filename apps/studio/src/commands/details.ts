import { commands, ExtensionContext } from "vscode";
import { detailsCommand, DetailsPanel } from "../panels/details.js";

export function registerDetails(context: ExtensionContext) {
  // Create the show hello world command
  const showDetailsCommand = commands.registerCommand(
    detailsCommand,
    (message) => {
      console.log("message = ", message);
      DetailsPanel.render(context.extensionUri, context, message).catch(
        console.error
      );
    }
  );

  // Add command to the extension context
  context.subscriptions.push(showDetailsCommand);
}
