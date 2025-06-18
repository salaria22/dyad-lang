import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
  ExtensionContext,
  ExtensionMode,
} from "vscode";
import { getUri } from "./get-uri.js";
import { getNonce } from "./get-nonce.js";
import type {
  DetailsMessage,
  DetailsNotification,
} from "@juliacomputing/dyad-protocol";
import { commandName } from "../common.js";

export const detailsCommand = commandName("showDetails");

const _localServerUrl = "http://localhost:5173";

/**
 * This class manages the state and behavior of the "Details" webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering Details webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class DetailsPanel {
  public static currentPanel: DetailsPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private isProduction: boolean;

  /**
   * The DetailsPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(
    panel: WebviewPanel,
    context: ExtensionContext,
    extensionUri: Uri
  ) {
    this._panel = panel;
    this.isProduction = context.extensionMode === ExtensionMode.Production;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static async render(
    extensionUri: Uri,
    context: ExtensionContext,
    message: DetailsMessage
  ) {
    // const isProduction = context.extensionMode === ExtensionMode.Production;

    if (DetailsPanel.currentPanel) {
      // If the webview panel already exists reveal it
      DetailsPanel.currentPanel._panel.reveal(ViewColumn.Two);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        detailsCommand,
        // Panel title
        "Dyad Studio Details",
        // The editor column the panel should be displayed in
        ViewColumn.Two,
        // Extra panel configurations
        {
          retainContextWhenHidden: true,
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, "out"),
            Uri.joinPath(extensionUri, "details-webview/build"),
            Uri.joinPath(extensionUri, "details-webview/build/assets"),
          ],
          // Content Security Policies prevent loading the vite dev server.
          // The issue seems to be that the vite dev server returns a content
          // type of text/html for assets/index.js which is a CSP violation.
          // localResourceRoots: isProduction
          //   ? [
          //       Uri.joinPath(extensionUri, "out"),
          //       Uri.joinPath(extensionUri, "details-webview/build"),
          //       Uri.joinPath(extensionUri, "details-webview/build/assets"),
          //     ]
          //   : [
          //       Uri.joinPath(extensionUri, "out"),
          //       Uri.parse(localServerUrl),
          //       Uri.parse(`${localServerUrl}/assets`),
          //     ],
          enableCommandUris: true,
        }
      );

      DetailsPanel.currentPanel = new DetailsPanel(
        panel,
        context,
        extensionUri
      );
    }
    await DetailsPanel.currentPanel._panel.webview.postMessage(message);
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    DetailsPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "details-webview",
      "build",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "details-webview",
      "build",
      "assets",
      "index.js",
    ]);

    // The below doesn't work because if we serve asset/index.js from the vite
    // server, it has a content type of text/html which is a CSP violation.

    // // The CSS file from the React build output
    // const stylesUri = this.isProduction
    //   ? getUri(webview, extensionUri, [
    //       "details-webview",
    //       "build",
    //       "assets",
    //       "index.css",
    //     ])
    //   : `${localServerUrl}/assets/index.css`;
    // // The JS file from the React build output
    // const scriptUri = this.isProduction
    //   ? getUri(webview, extensionUri, [
    //       "details-webview",
    //       "build",
    //       "assets",
    //       "index.js",
    //     ])
    //   : `${localServerUrl}/assets/index.js`;

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
            webview.cspSource
          }; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" nonce="${nonce}" type="text/css" href="${stylesUri.toString()}">
          <title>Dyad Studio Details</title>
        </head>
        <body>
          <script>
            const vscode = acquireVsCodeApi();
            window.onload = function() {
              vscode.postMessage({ command: 'get-data' });
              console.log('Ready to accept data.');
            };
          </script>
          <div id="root" style="width: 100%; height: 100%"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri.toString()}"></script>
        </body>
      </html>
    `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is received.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: DetailsNotification) => {
        console.log("message to extension:", message);

        switch (message.kind) {
          case "selection":
            // Code that should run in response to the hello message command
            await window.showInformationMessage(message.path);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}
