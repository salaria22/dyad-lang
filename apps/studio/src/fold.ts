import * as vscode from "vscode";
import { ASTNode, isMetadataNode } from "@juliacomputing/dyad-ast";
import { ASTWalker, walkAST } from "@juliacomputing/dyad-kernel";
import { Maybe, Nothing } from "purify-ts";
import { parseDocument } from "./documents.js";

// I got this from:
// https://github.com/microsoft/vscode/blob/e02d14210805688fc558069c5b8ffeb2d9fbb9f1/src/vs/editor/contrib/folding/browser/folding.ts#L585
interface FoldArguments {
  levels: number;
  selectionLines: number[];
}

/**
 * This function takes the body of what is presumably in the currently active editor
 * and issues instructions (via `executeCommand`) to fold specific regions that contain
 * any metadata.
 *
 * @param body
 * @param instance
 */
export async function foldMetadata(document: vscode.TextDocument) {
  const selectionLines: Array<FoldArguments> = [];

  const walker: ASTWalker<ASTNode> = {
    enter: (node: ASTNode, parent: Maybe<ASTNode>): boolean => {
      if (isMetadataNode(node)) {
        const decl = parent.extractNullable()?.kind === "cdecl";
        const sl = node.span?.sl;
        if (sl !== undefined) {
          selectionLines.push({
            levels: decl ? 1 : 1,
            // Something odd about line numbering, if we want to fold
            // component level metadata we need to subtract one.  I don't
            // really understand why though.
            selectionLines: [decl ? sl : sl - 1],
          });
        }
        return false;
      }
      return true;
    },
    leave: (): void => {},
  };

  (await parseDocument(document)).ifJust((ast) =>
    walkAST(ast, walker, Nothing)
  );

  const folds = selectionLines.map((line) =>
    vscode.commands.executeCommand("editor.fold", line)
  );
  await Promise.all(folds);
}
