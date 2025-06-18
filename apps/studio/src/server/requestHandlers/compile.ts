import { createConnection } from "vscode-languageserver/node";
import { SharedExtensionVariables } from "../shared.js";
import {
  MTK,
  queryLibraries,
  stringifyProblem,
  Workspace,
  castOrThrow,
  queryModule,
  fileProblems,
  getFileEntity,
} from "@juliacomputing/dyad-kernel";
import {
  CompileResponseParams,
  compileMethod,
} from "../../requestDefinitions/compile.js";
import path from "path";
import { NodeNoWriteFileSystem } from "../nodefs.js";
import { Problem } from "@juliacomputing/dyad-common";
import { isTextProblem, SourceKey } from "@juliacomputing/dyad-ast";
import { URI } from "vscode-uri";
import { sendDiagnostics } from "../diagnostics.js";

export function registerCompileHandler(
  connection: ReturnType<typeof createConnection>,
  shared: SharedExtensionVariables
) {
  connection.onRequest(compileMethod, (): Promise<CompileResponseParams> => {
    const workspace = castOrThrow(
      shared.workspace,
      Error("Unable to find shared workspace")
    );
    return shared.queue(
      () => performCompilation(connection, workspace, shared),
      `compile`
    );
  });
}

export async function performCompilation(
  connection: ReturnType<typeof createConnection>,
  workspace: Workspace,
  shared: SharedExtensionVariables
): Promise<CompileResponseParams> {
  const ret: Record<string, string> = {};
  const libNodes = workspace.query(queryLibraries);
  const libs = Object.keys(shared.libraryDirectories);

  const problems: Problem[] = [];
  const byFile = new Map<string, Problem[]>();

  const noteProblems = (
    modprob: Problem[],
    provider: NodeNoWriteFileSystem
  ) => {
    for (const problem of modprob) {
      if (
        isTextProblem(problem) &&
        problem.extra.file !== null &&
        problem.extra.span !== null
      ) {
        const abs = provider.absolutePath(problem.extra.file);
        const uri = URI.file(abs);
        const cur = byFile.get(uri.toString()) ?? [];
        cur.push(problem);
        byFile.set(uri.toString(), cur);
      }
    }

    problems.push(...modprob);
  };

  // Loop over libraries
  for (const libname of libs) {
    const libnode = libNodes[libname];

    // If this isn't a development library, skip it
    if (shared.libraryStatus[libname] !== "dev") {
      continue;
    }

    try {
      // Find the provider for the current library
      const provider = shared.libraryProviders[libname];

      // If we can find the current library and it is an instance of
      // NodeNoWriteFileSystem then we should generate code for it.
      if (provider && provider instanceof NodeNoWriteFileSystem) {
        // Find all generated files and remove them
        const gfiles = await provider.readdir("generated");
        for (const gf of gfiles.filter(generatedFile)) {
          await provider.unlink(path.join("generated", gf));
        }

        // Create a handler for handling file system related
        // events associated with the current provider.
        const handler = new MTK.FSHandler(provider);

        const start = process.cpuUsage();

        const modules: Array<string[]> = [[]];

        for (const mod of modules) {
          console.log(`Compiling module ${mod.join(".")}`);
          // Run the following code excluding other interactions with
          // the workspace...
          const module = castOrThrow(
            workspace.query(queryModule(libname, mod)),
            new Error(`Unknown module ${mod.join(".")}`)
          );
          const files: Array<SourceKey> = [];
          const checks = module.files.reduce<Problem[]>((p, c) => {
            const thisFile = workspace.query(
              fileProblems(workspace.query(getFileEntity(c)))
            );
            if (thisFile.length > 0) {
              files.push(c.source);
            }
            return [...p, ...thisFile];
          }, []);
          const filenames = files.map((x) => `${[...x.mod, x.file].join("/")}`);
          console.log(
            `Found ${checks.length} pre-compilation issues in ${filenames.join(
              ", "
            )}`
          );
          if (checks.length > 0) {
            console.log("Compile failed because of the following problems:");
            for (const problem of checks) {
              console.log(stringifyProblem(problem));
            }
            console.log("No compilation performed because of static errors");
            noteProblems(checks, provider);
          } else {
            const modprob = await MTK.generateMTKCode(
              workspace,
              libnode,
              mod,
              handler
            );

            const diff = process.cpuUsage(start);
            console.log(
              `Compiled ${libname} in ${diff.system}μs sys and ${diff.user}μs user`
            );
            noteProblems(modprob, provider);
          }
        }
      } else {
        ret[libname] =
          `Unable to find provider for library '${libname}'.  Recognized providers: ${Object.keys(
            shared.libraryProviders
          ).join(", ")}`;
      }
    } catch (e) {
      ret[libname] = (e as Error).message;
    }
  }

  for (const [uri, problems] of byFile) {
    console.log(`Sending ${problems.length} problems associated with ${uri}`);
    sendDiagnostics(connection, uri, 0, problems);
  }

  for (const problem of problems) {
    console.log(stringifyProblem(problem));
  }

  // Why not just return all problems?
  return { failures: ret, problems };
}

const includeFiles = MTK.codeGenAspects.map((x) => `${x}s.jl`);
const endings = MTK.codeGenAspects.map((x) => `_${x}.jl`);

/**
 * This function checks whether a given filename matches the pattern
 * of generated files.  It is used ot determine which files should be
 * removed from the `generated` folder prior to compilation.
 * @param filename
 * @returns
 */
function generatedFile(filename: string) {
  return (
    includeFiles.includes(filename) || endings.some((x) => filename.endsWith(x))
  );
}
