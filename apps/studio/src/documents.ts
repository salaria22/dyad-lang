import * as vscode from "vscode";
import { ASTNode, sourceKey } from "@juliacomputing/dyad-ast";
import { AstBuilder, parseDyad } from "@juliacomputing/dyad-parser";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";

const builder = new AstBuilder();

export async function parseDocument(
  doc: vscode.TextDocument
): Promise<Maybe<ASTNode>> {
  const instance = doc.fileName;
  const body = await doc.getText();
  const foo = parseDyad(body, instance, null);
  if (foo.lexErrors.length > 0 || foo.parseErrors.length > 0) {
    return Nothing;
  }
  try {
    const ast = builder.file(foo.cst.children, {
      provider: "",
      file: sourceKey(instance, []),
    });
    return Just(ast);
  } catch (e) {
    return Nothing;
  }
}
