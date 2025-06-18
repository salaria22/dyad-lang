import debug from "debug";
import { MTK, queryLibrary } from "@juliacomputing/dyad-kernel";
import { isProblemSpan } from "@juliacomputing/dyad-ast";
import { initializeWorkspace } from "@juliacomputing/dyad-kernel/node";
import path from "path";

const compileLog = debug("cli:single");

export async function runSingleCompilerPass(
  pkgdir: string,
  project?: string
): Promise<number> {
  const { workspace, nfs, projectName } = await initializeWorkspace(
    pkgdir,
    project
  );

  // Find the library we are looking for
  const lib = workspace.query(queryLibrary(projectName)).unsafeCoerce();

  // Create a code generator handler
  const handler = new MTK.FSHandler(nfs);
  // const handler = new DAECompiler.FSHandler(nfs);
  // Run the code generation process
  compileLog("Generating code");
  const problems = await MTK.generateMTKCode(workspace, lib, [], handler);
  // const problems = await DAECompiler.generateDAECode(workspace, lib, [], handler);
  // Wait for all I/O to be completed
  await handler.close();
  compileLog("Handlers, closed (all code should now be written)");
  // Output any problems found to stderr

  const messages = [
    ...new Set(
      problems.map((p) => {
        const extra = p.extra;
        if (extra && isProblemSpan(extra) && extra.file && extra.span) {
          const apath = nfs.absolutePath(extra.file);
          const rpath = path.relative(pkgdir, apath);
          return `${rpath}:${extra.span.sl}:${extra.span.sc} - ${p.type}: ${p.details}`;
        } else {
          return `${p.type} - ${p.details}`;
        }
      })
    ),
  ].sort();
  for (const msg of messages) {
    console.error("Compilation error: ", msg);
  }

  compileLog("Done generating code");
  if (messages.length > 0) {
    return 1;
  }
  return 0;
}
