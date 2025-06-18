import { uriScheme } from "@juliacomputing/dyad-common";
import { TextDocumentContentProvider, Uri } from "vscode";
import * as vscode from "vscode";

export const diagramUriScheme = `${uriScheme}diag`;
export const dataUriScheme = `${uriScheme}data`;

/**
 * This is kind a data: uri provider, but it skips the content type information
 * and encoding information.  Instead, the path is the uri encoded content.  This
 * can't be used in place of `DiagramProvider` because the SVG previewer requires
 * the path to have an extension to recognize it.  But this might be useful in
 * other future contexts.
 */
export class DyadDataProvider implements TextDocumentContentProvider {
  async provideTextDocumentContent(uri: Uri): Promise<string> {
    const ret = decodeURI(uri.path);
    return ret;
  }
}

/**
 * This content provider is a simple uri decoding wrapper.  It expects
 * a URI of the form:
 *
 * dyaddiag:<filename>&svg=....
 *
 * When it gets such a URI it simple decodes the svg query parameter
 * and returns it.  Note that this provider doesn't care what the extension
 * is, but to use it in conjunction with the SVG previewer, the path must
 * end with `.svg`.
 *
 * I'd like to have this provider automatically "update" when the underlying
 * content at the document referenced by the URI changes.  I tried, but nothing
 * I did seemed to cause the built-in text editor to update.  Here are some
 * links for reference:
 *
 * https://code.visualstudio.com/api/extension-guides/virtual-documents#update-virtual-documents
 * https://github.com/microsoft/vscode-docs/issues/3183
 * https://github.com/microsoft/vscode-extension-samples/blob/main/virtual-document-sample/src/extension.ts#L15-L16
 *
 */
export class DiagramProvider implements TextDocumentContentProvider {
  async provideTextDocumentContent(uri: Uri): Promise<string> {
    // What this really should do is grab the file details for the URI with the
    // file: scheme, use the query string to identify which diagram within that
    // file to render and then return the SVG associated with that diagram
    const query = new URLSearchParams(uri.query ?? "");
    const svg = query.get("svg");
    if (svg === undefined || svg === null) {
      await vscode.window.showInformationMessage(
        `Unable to render SVG for ${uri.path}`
      );
      throw new Error(`Unable to render SVG for ${uri.path}`);
    }
    return svg;
  }
}

export function registerTextContentProviders(context: vscode.ExtensionContext) {
  const diagramProvider = new DiagramProvider();

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      diagramUriScheme,
      diagramProvider
    )
  );

  const dataProvider = new DyadDataProvider();

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      dataUriScheme,
      dataProvider
    )
  );
}
