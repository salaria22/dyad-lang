import {
  libraryEntity,
  stringifyProblem,
  renderDocumenterDocumentation,
  Workspace,
  documenterOptions,
} from "@juliacomputing/dyad-kernel";
import {
  initializeWorkspace,
  NodeAsyncFileSystem,
} from "@juliacomputing/dyad-kernel/node";
import path from "path";
import fs from "fs";

import debug from "debug";

const docLog = debug("cli:document");

export interface DocumentOptions {
  dir: string;
  project?: string;
}

export async function document(libname: string, options: DocumentOptions) {
  docLog("Request to document library %s", libname);
  const entity = libraryEntity(libname);
  docLog("  Initializating workspace from %s", options.dir);
  const docsdir = path.join(options.dir, "docs");
  docLog("  Generating documentation to %s", docsdir);
  docLog("  Documenting entity: %s", entity);

  const { workspace, nfs } = await initializeWorkspace(
    options.dir,
    options.project
  );
  docLog("  Workspace initialized");

  await fs.promises.mkdir(docsdir, { recursive: true });
  await fs.promises.mkdir(path.join(docsdir, "src"), { recursive: true });
  const docfs = new NodeAsyncFileSystem(docsdir, []);
  docLog("  File system ready to write docs at %s", docsdir);

  try {
    docLog("  Rendering documentation...");
    const problems = await (workspace as any as Workspace).query(({ query }) =>
      renderDocumenterDocumentation(
        // This is here because we produce two different packages from
        // dyad-kernel, one that is generic and one that is Node specific. The
        // node specific one references the generic but this results in two
        // (apparently "incompatible") `Workspace` types.  This just ignores that
        // difference (because they are, ultimately, the same). There is almost
        // certainly a better way to handle this but I just haven't researched it
        // enough yet.
        query,
        entity,
        docfs,
        documenterOptions
      )
    );
    docLog("  ...done");
    if (problems.length > 0) {
      console.error("Problems found:");
    }
    for (const problem of problems) {
      console.error(
        "While rendering documentation: ",
        stringifyProblem(problem)
      );
    }
  } finally {
    workspace.close();
    nfs.close();
    docfs.close();
  }
}
