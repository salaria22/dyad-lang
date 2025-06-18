import { createConnection } from "vscode-languageserver/node";
import { SharedExtensionVariables } from "../shared.js";
import {
  queryLibraries,
  Workspace,
  castOrThrow,
  renderDocumenterDocumentation,
  libraryEntity,
  documenterOptions,
} from "@juliacomputing/dyad-kernel";
import {
  GenerateDocumentationResponseParams,
  generateDocumentationMethod,
} from "../../requestDefinitions/gendoc.js";
import path from "path";
import { NodeNoWriteFileSystem } from "../nodefs.js";
import { NodeAsyncFileSystem } from "@juliacomputing/dyad-kernel/node";
import { baseLibraryName, Problem } from "@juliacomputing/dyad-common";
import {
  exceptionThrown,
  noProvider,
} from "../../requestDefinitions/errors.js";

export function registerGenerateDocumentationHandler(
  connection: ReturnType<typeof createConnection>,
  shared: SharedExtensionVariables
) {
  connection.onRequest(
    generateDocumentationMethod,
    (): Promise<GenerateDocumentationResponseParams> => {
      const workspace = castOrThrow(
        shared.workspace,
        Error("Unable to find shared workspace")
      );
      return shared.queue(
        () => performDocumentationGeneration(workspace, shared),
        `compile`
      );
    }
  );
}

export async function performDocumentationGeneration(
  workspace: Workspace,
  shared: SharedExtensionVariables
) {
  console.log("Performing documentation generation");
  const problems: Problem[] = [];
  const query = workspace.query.bind(workspace);

  const libs = workspace.query(queryLibraries);

  // Loop over libraries
  for (const libname of Object.keys(libs)) {
    if (libname === baseLibraryName) {
      continue;
    }

    console.log("Generating documentation for library ", libname);
    try {
      const entity = libraryEntity(libname);

      // Find the provider for the current library
      const provider = shared.libraryProviders[libname];
      const dir = shared.libraryDirectories[libname];
      if (dir === undefined) {
        console.log(
          `  No directory identified for ${libname} (probably a dependency), skipping`
        );
        continue;
      }
      const docsdir = path.join(dir, "docs");
      console.log(`  Writing docs for ${libname} in ${docsdir}`);
      const docfs = new NodeAsyncFileSystem(docsdir, []);

      // If we can find the current library and it is an instance of
      // NodeNoWriteFileSystem then we should generate code for it.
      if (provider && provider instanceof NodeNoWriteFileSystem) {
        const probs = await renderDocumenterDocumentation(
          query,
          entity,
          docfs,
          documenterOptions
        );
        problems.push(...probs);
        console.log("Generated documentation for ", libname);
      } else {
        problems.push(
          noProvider(
            libname,
            `Unable to find provider for library '${libname}'.  Recognized providers: ${Object.keys(
              shared.libraryProviders
            ).join(", ")}`
          )
        );
      }
    } catch (e: any) {
      console.error("Exception thrown while generating docs for ", libname);
      console.error(e);
      problems.push(exceptionThrown(libname, e.message));
    }
  }
  return { problems };
}
