import * as vscode from "vscode";
import { SharedClientInformation } from "./shared.js";
import { registerCompileCommand } from "./commands/compile.js";
import { registerCreateComponentLibraryCommand } from "./commands/create.js";
import { registerDetails } from "./commands/details.js";
import { registerRestartCommand } from "./commands/restart.js";
import { registerGenerateDocumentationCommand } from "./commands/gendoc.js";
import { registerShowFlattenedComponentCommand } from "./commands/showFlattenedComponent.js";

export function registerCommands(
  context: vscode.ExtensionContext,
  shared: SharedClientInformation
) {
  registerRestartCommand(context, shared);
  registerCompileCommand(context, shared);
  registerGenerateDocumentationCommand(context, shared);
  registerCreateComponentLibraryCommand(context);
  registerDetails(context);
  registerShowFlattenedComponentCommand(context);
}
