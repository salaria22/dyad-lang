import * as vscode from "vscode";
import type { SourceMessage } from "@juliacomputing/dyad-protocol";
import { commandName } from "../common.js";
import {
  FlattenedComponentProvider,
  FLATTENED_COMPONENT_URI,
} from "../flattenedComponentProvider.js";

export const showFlattenedComponentCommand = commandName(
  "showFlattenedComponent"
);

export function registerShowFlattenedComponentCommand(
  context: vscode.ExtensionContext
) {
  const command = vscode.commands.registerCommand(
    showFlattenedComponentCommand,
    async (message: SourceMessage) => {
      if (message.kind !== "source") {
        void vscode.window.showErrorMessage(
          "Invalid message type for flattened component."
        );
        return;
      }

      try {
        // Set the content for our provider
        FlattenedComponentProvider.setContent(message.code);

        // Open the document using our custom URI
        // VS Code will use the FileSystemProvider registered for the scheme.
        const document = await vscode.workspace.openTextDocument(
          FLATTENED_COMPONENT_URI
        );

        await vscode.window.showTextDocument(document, {
          viewColumn: vscode.ViewColumn.Beside,
          preview: true,
          preserveFocus: false,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Failed to show flattened component: ${errorMessage}`
        );
        console.error("Failed to show flattened component:", error);
      }
    }
  );

  context.subscriptions.push(command);
}
