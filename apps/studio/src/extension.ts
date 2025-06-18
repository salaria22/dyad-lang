// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import path from "path";
import {
  TransportKind,
  LanguageClient,
  ServerOptions,
} from "vscode-languageclient/node";
import { Just, Nothing } from "purify-ts/Maybe";
import { registerCommands } from "./commands.js";
import { SharedClientInformation } from "./shared.js";
import { updateTests } from "./tests.js";
import { registerTextContentProviders } from "./providers/content.js";
import { DyadCodeLensProvider } from "./codelens.js";
import { dyadSelector } from "./common.js";
import { registerFormattingProviders } from "./providers/format.js";
import { triggerCompile } from "./commands/compile.js";
import { registerRestartHandler } from "./restart.js";
import { languageName } from "@juliacomputing/dyad-common";
import {
  FlattenedComponentProvider,
  FLATTENED_COMPONENT_SCHEME,
} from "./flattenedComponentProvider.js";

let client: LanguageClient;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  let log = vscode.window.createOutputChannel("Dyad Studio Client Log");

  const shared: SharedClientInformation = {
    client: Nothing,
    log,
  };

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  log.appendLine(
    `Congratulations, the ${languageName} Studio extension is running`
  );

  // Add the various URI schemes for...nothing at the moment
  registerTextContentProviders(context);

  // Add formatting for Dyad files
  registerFormattingProviders(context);

  // Register any commands we want to see client side
  registerCommands(context, shared);

  // Register the FileSystemProvider for flattened components
  const flattenedComponentProvider = new FlattenedComponentProvider();
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(
      FLATTENED_COMPONENT_SCHEME,
      flattenedComponentProvider,
      { isReadonly: true, isCaseSensitive: false } // Mark as read-only
    )
  );

  // Activate the LSP
  const serverOptions = configureServer(context, shared);

  // Now start the client and give it the information required
  // to connect to the server
  client = await startClient(context, shared, serverOptions);

  // Create a file watcher that looks for changes to `Manifest.toml`
  // and, when detected, restarts the language server.
  const disposeHandler = registerRestartHandler(client, shared);

  // Dispose of handler when context is disposed of
  context.subscriptions.push({
    dispose: () => disposeHandler(),
  });

  // The documentation to make this actually do useful things can be found here:
  // https://code.visualstudio.com/api/extension-guides/testing
  const controller = vscode.tests.createTestController(
    "DyadTests",
    "Dyad Tests"
  );
  // When should this be triggered?
  updateTests(client, controller).catch(console.error);
}

async function startClient(
  context: vscode.ExtensionContext,
  shared: SharedClientInformation,
  serverOptions: ServerOptions
) {
  const clientOptions = {
    documentSelector: [{ scheme: "file", language: dyadSelector }],
    synchronize: {
      fileEvents: [vscode.workspace.createFileSystemWatcher("**/*.dyad")],
    },
  };

  const client = new LanguageClient(
    "dyad-studio-server",
    "Dyad Studio Language Server",
    serverOptions,
    clientOptions
  );

  await client.start();
  shared.client = Just(client);

  await potentiallyAutoCompile(client, shared.log);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (_document) => {
      // Whenever we open a file, fold the metadata away....
      // await foldMetadata(document);
    })
  );

  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeTextDocument((foo) => {
  //     shared.log.appendLine(`Document ${foo.document.uri.toString()} changed`);
  //   })
  // );

  // context.subscriptions.push(
  //   vscode.workspace.onDidCloseTextDocument((foo) => {
  //     shared.log.appendLine(`Document ${foo.fileName} closed`);
  //   })
  // );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (foo) => {
      // ignore files in the generated directory
      const dir = path.dirname(foo.fileName);
      if (dir.endsWith("/generated")) {
        shared.log.appendLine(
          `Ignoring manual change to generated file: ${foo.fileName}`
        );
        return;
      }
      shared.log.appendLine(`File ${foo.fileName} just saved`);
      await potentiallyAutoCompile(client, shared.log);
    })
  );

  context.subscriptions.push({
    dispose: () => client.stop(),
  });

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      dyadSelector,
      new DyadCodeLensProvider(client, context)
    )
  );

  return client;
}

/**
 * Perform auto-compilation if VS Code settings have it enabled.
 *
 * @param client
 * @param log
 */
export async function potentiallyAutoCompile(
  client: LanguageClient,
  log: vscode.OutputChannel
) {
  const config = vscode.workspace.getConfiguration("dyad-studio");
  const autoCompile = config.get("autoCompile");
  log.appendLine(`auto compile on save: '${JSON.stringify(autoCompile)}'`);
  console.log(`autoCompile = `, autoCompile);

  if (autoCompile) {
    log.appendLine("Running compiler");
    console.log("Running compiler");
    try {
      await triggerCompile(client);
    } catch (e: any) {
      console.error(e);
      await vscode.window.showInformationMessage(e.message);
    }
    log.appendLine("Compiler ran");
  }
}

/**
 * This function is used to activate the LSP for Dyad
 * @param context
 * @returns
 */
function configureServer(
  context: vscode.ExtensionContext,
  shared: SharedClientInformation
) {
  // Register your language with VSCode here
  const serverModule = context.asAbsolutePath(
    path.join("out", "server", "server.js")
  );

  const config = vscode.workspace.getConfiguration("dyad-studio");
  const serverDebug = config.get("serverDebug");
  shared.log.appendLine(
    `Debug settings for server: '${JSON.stringify(serverDebug)}`
  );

  const packageServer = vscode.workspace
    .getConfiguration("julia")
    .get<string>("packageServer");

  const juliaExe = vscode.workspace
    .getConfiguration("julia")
    .get<string>("executablePath");

  const env = {
    DEBUG: serverDebug,
    JULIA_PKG_SERVER: packageServer,
    USE_JULIA: juliaExe,
  };

  // Provide the correct path
  const debugOptions = {
    execArgv: ["--nolazy", "--inspect=6010"],
    env,
  };

  const runOptions = {
    env,
  };

  shared.log.appendLine(`Server command: '${serverModule}'`);

  const serverOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: runOptions,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  return serverOptions;
}

// This method is called when your extension is deactivated
export function deactivate() {}
