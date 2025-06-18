import { DocumentFormattingEditProvider, TextDocument, TextEdit } from "vscode";
import { parseDocument } from "../documents.js";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import * as vscode from "vscode";
import { dyadSelector } from "../common.js";

export class DyadFormattingEditProvider
  implements DocumentFormattingEditProvider
{
  async provideDocumentFormattingEdits(
    document: TextDocument
  ): Promise<TextEdit[] | null> {
    var firstLine = document.lineAt(0);
    var lastLine = document.lineAt(document.lineCount - 1);
    var originalRange = new vscode.Range(
      firstLine.range.start,
      lastLine.range.end
    );
    return (await parseDocument(document))
      .map<TextEdit[] | null>((ast) => {
        const formatted = unparseDyad(ast);
        return [TextEdit.replace(originalRange, formatted)];
      })
      .orDefault(null);
  }
}

export function registerFormattingProviders(context: vscode.ExtensionContext) {
  const formatting = new DyadFormattingEditProvider();

  const disposable = vscode.languages.registerDocumentFormattingEditProvider(
    dyadSelector,
    formatting
  );

  context.subscriptions.push(disposable);
}
