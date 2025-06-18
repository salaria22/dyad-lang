import { WorkspaceFolder } from "vscode-languageserver/node";
import {
  LibraryProvider,
  queryLibraries,
  Selector,
  Workspace,
} from "@juliacomputing/dyad-kernel";
import { NodeNoWriteFileSystem } from "./nodefs.js";
import { firstValueFrom } from "rxjs";
import fs from "fs";
import path from "path";
import { SharedExtensionVariables } from "./shared.js";
import { Just } from "purify-ts/Maybe";
import { ASTNode, nodeChildren } from "@juliacomputing/dyad-ast";
import { uriFilename } from "./context.js";
import {
  NodeAsyncFileSystem,
  dyadWatchTargets,
  isDyadPackage,
} from "@juliacomputing/dyad-kernel/node";
import debug from "debug";
import { sourceFolder } from "@juliacomputing/dyad-common";

const workspaceLog = debug("workspace:init");

export async function initializeWorkspace(
  folders: WorkspaceFolder[],
  shared: SharedExtensionVariables
): Promise<Workspace> {
  const workspace = await Workspace.create();
  workspaceLog("Workspace created");
  for (const folder of folders ?? []) {
    workspaceLog("Processing folder %s", folder);
    await uriFilename(folder.uri).caseOf({
      Nothing: async () =>
        console.error(
          `Folder URI ${folder.uri} did not contain a file/directory name, skipping`
        ),
      Just: async (dir) => {
        workspaceLog("Adding directory %s to workspace", dir);
        try {
          // This really shouldn't be needed now because the `activateEvents` for this extension
          // specifies that this directory should be present.
          const sourceDir = path.join(dir, sourceFolder);
          workspaceLog("Checking for directory %s", sourceDir);
          await fs.promises.stat(sourceDir);
          const nfs = new NodeNoWriteFileSystem(dir, dyadWatchTargets);
          const id = await workspace.registerProvider(nfs);
          await workspace.waitForId(id);
          try {
            const proj = await firstValueFrom(nfs.project());
            shared.libraryDirectories[proj.name] = dir;
            shared.libraryProviders[proj.name] = nfs;
            shared.libraryStatus[proj.name] = "dev";
            workspaceLog(
              `Folder for library %s has been registered with the Workspace`,
              proj.name
            );
          } catch (e) {
            console.error(
              `Error fetching project information for library in folder ${folder.uri}: `,
              e
            );
          }
        } catch (e) {
          console.error(e);
          console.warn(
            `The directory ${dir} doesn't appear to be a Dyad related project, excluding it from the Workspace`
          );
        }
      },
    });
  }

  // Now attempt to load any dependencies (component libraries) not already found
  // in a workspace.
  const ignore = [...Object.keys(shared.libraryProviders)];
  const providers = [...Object.values(shared.libraryProviders)];

  workspaceLog(`Libraries loaded: %j`, ignore);
  workspaceLog(
    `Iterating over %d providers to identify non-workspace dependencies`,
    providers.length
  );
  for (const provider of providers) {
    const proj = await firstValueFrom(provider.project());
    const dir = shared.libraryDirectories[proj.name];

    await loadDependencies(shared, workspace, provider, ignore, dir);
  }

  workspaceLog(
    `Workspace online with libraries: %s`,
    [...Object.keys(workspace.query(queryLibraries))].join(", ")
  );
  workspaceLog(
    `Known providers: %s`,
    [...Object.keys(shared.libraryProviders)].join(", ")
  );
  shared.workspace = Just(workspace);
  shared.workspaceObservable.next(workspace);
  workspaceLog("Workspace published to observable");
  return workspace;
}

function search<T extends ASTNode>(
  node: ASTNode,
  predicate: (node: ASTNode) => node is T
): T[] {
  const ret: T[] = [];
  if (predicate(node)) {
    ret.push(node);
  }
  const children = nodeChildren(node);
  for (const [_, c] of Object.entries(children)) {
    ret.push(...search(c, predicate));
  }
  return ret;
}

export function queryPredicate<T extends ASTNode>(
  predicate: (node: ASTNode) => node is T
): Selector<T[]> {
  return ({ root }) => search(root, predicate);
}

export function getJuliaExe() {
  const useJulia = process.env["USE_JULIA"];
  const juliaExe =
    useJulia === undefined || useJulia === "" ? "julia" : useJulia;

  return juliaExe;
}

async function loadDependencies(
  shared: SharedExtensionVariables,
  workspace: Workspace,
  provider: LibraryProvider,
  ignore: string[],
  projectDirectory: string
) {
  console.log("Attempting to read project information...");
  const proj = await firstValueFrom(provider.project());
  const deps = [...Object.keys(proj.deps ?? {})];
  const juliaExe = getJuliaExe();

  console.log("...done");

  console.log(`Dependencies for library ${proj.name}: ${deps.join(", ")}`);

  for (const dep of deps) {
    try {
      workspaceLog(
        `Processing dependency '${dep}' to check if it's a Dyad component library`
      );

      const possibleDir = await isDyadPackage(
        juliaExe,
        projectDirectory,
        projectDirectory,
        dep,
        workspaceLog
      );
      await possibleDir.ifJust(async (dir) => {
        workspaceLog("  Dyad component library '%s' is in '%s'", dep, dir);

        const dfs = new NodeAsyncFileSystem(dir, []);
        const id = await workspace.registerProvider(dfs);
        await workspace.waitForId(id);
        const dproj = await firstValueFrom(dfs.project());
        shared.libraryProviders[dproj.name] = dfs;
        shared.libraryStatus[dproj.name] = "dep";
        workspaceLog(
          "Loaded version %s of Dyad library %s",
          dproj.version,
          dproj.name
        );
      });
    } catch (e) {
      console.error(
        `Error processing dependency '${dep}' for potential Dyad component registration: ${e instanceof Error ? e.message : String(e)}`
      );
      // For more detailed debugging, uncomment the line below:
      // console.error("Full error object:", e);
    }
  }
}
