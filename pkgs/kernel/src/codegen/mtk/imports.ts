// Import all dependencies so they are in scope and usable in case the emitted
// code references them.  We could scan ahead and determine which dependencies
// (if any!) are actually needed by the code emitted after this.  But that would
// require "two passes" (one to determine the dependencies and one to emit the

import { DyadLibrary } from "@juliacomputing/dyad-ast";
import { Workspace, queryLibraries } from "../../workspace/index.js";
import { MTKHandler } from "./events.js";
import { baseLibraryName } from "@juliacomputing/dyad-common";

// required `import` statements) and for now it just doesn't seem necessary.
export async function emitImports(
  workspace: Workspace,
  emittedLibrary: DyadLibrary,
  module: string[],
  handler: MTKHandler
) {
  const libs = workspace.query(queryLibraries);
  const lines: string[] = [];
  for (const [lname, lib] of Object.entries(libs)) {
    if (lib !== emittedLibrary && lname !== baseLibraryName) {
      lines.push(`import ${lname}`);
    }
  }
  if (lines.length > 0) {
    await handler.preamble(module, "definition", lines.join("\n"));
  }
}
