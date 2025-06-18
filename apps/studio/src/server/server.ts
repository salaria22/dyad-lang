import {
  createConnection,
  InitializeParams,
  ProposedFeatures,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { registerDocuments } from "./document.js";
import { getJuliaExe, initializeWorkspace } from "./workspace.js";
import { Nothing } from "purify-ts";
import { SharedExtensionVariables, TaskHandler } from "./shared.js";
import { Workspace } from "@juliacomputing/dyad-kernel";
import { ReplaySubject } from "rxjs";
import { registerCompileHandler } from "./requestHandlers/compile.js";
import { registerTestHandler } from "./requestHandlers/tests.js";
import { registerFileDetailsHandler } from "./requestHandlers/file_details.js";
import Queue from "queue";
import debug from "debug";
import { registerGenerateDocumentationHandler } from "./requestHandlers/gendoc.js";
import { languageName } from "@juliacomputing/dyad-common";
import { run_script } from "@juliacomputing/dyad-kernel/node";

Error.stackTraceLimit = Infinity;

const queueLog = debug("jss:queue");
const registryLog = debug("pkg:registry");

/**
 * This function provides some scope so we don't just place variables in global scope
 */
function start() {
  const q = new Queue({ concurrency: 1, autostart: true });

  let taskId = 0;
  const add: TaskHandler = <T>(f: () => Promise<T>, desc: string): Promise<T> =>
    new Promise((resolve, reject) => {
      queueLog(
        "Adding a new task to a queue that contains %d tasks already",
        q.length
      );
      const myTaskId = taskId;
      taskId++;
      queueLog("Adding task %d", myTaskId);
      q.push(async () => {
        try {
          queueLog("Starting work on task %d: %s", myTaskId, desc);
          const value = await f();
          queueLog("...task %d successfully completed", myTaskId);
          resolve(value);
        } catch (e: any) {
          queueLog("...task %d generated error %s", myTaskId, e.message);
          reject(e);
        }
      });
    });

  const shared: SharedExtensionVariables = {
    queue: add,
    workspace: Nothing,
    libraryDirectories: {},
    libraryProviders: {},
    libraryStatus: {},
    workspaceObservable: new ReplaySubject<Workspace>(1),
  };

  /** Create connection */
  const connection = createConnection(ProposedFeatures.all);

  /** Create text document handler (including update handler) */
  const documents = registerDocuments(connection, shared);

  registerCompileHandler(connection, shared);

  registerGenerateDocumentationHandler(connection, shared);

  registerFileDetailsHandler(connection, shared);

  registerTestHandler(connection, shared);

  connection.onInitialize(async (params: InitializeParams) => {
    await addRegistries();
    // Initialize the Workspace
    await initializeWorkspace(params.workspaceFolders ?? [], shared);
    console.log(`${languageName} Server initialized`);
    console.log("  Debug setting: ", process.env["DEBUG"]);
    console.log(
      "  Julia package server setting: ",
      process.env["JULIA_PKG_SERVER"]
    );
    console.log("  Julia executable setting: ", process.env["USE_JULIA"]);

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Full,
        // Add other capabilities as needed
      },
    };
  });

  documents.listen(connection);
  connection.listen();
}

const juliaHubRegistries = ["DyadRegistry"];

async function addRegistries() {
  try {
    const juliaExe = getJuliaExe();

    const stdout = await run_script(
      juliaExe,
      ["-e", `using Pkg; Pkg.Registry.status()`],
      "."
    );

    registryLog("Registry.status output = %s", stdout);

    if (
      !juliaHubRegistries.some((juliaHubRegistry) =>
        stdout.includes(juliaHubRegistry)
      )
    ) {
      const stdout = await run_script(
        juliaExe,
        ["-e", `using Pkg; Pkg.Registry.add(; uuid = "07e6f81e-a02a-4ea6-9289-c3820c24b8ed", name = "DyadRegistry"); Pkg.add("Revise")`],
        "."
      );
      registryLog("Registry.add output = %s", stdout);
    } else {
      registryLog(
        "Registry already contains %s, nothing to do",
        juliaHubRegistries.join(" or ")
      );
    }
  } catch (e) {
    console.error("Unable to run code to automatically update registry: ", e);
  }
}

start();
