import debug from "debug";
import path from "path";
import { v4 } from "uuid";
import { FileSystemInterface } from "../../providers/index.js";
import { PackageEntry, defaultContents, defaultPackages } from "./defaults.js";
import { sourceFolder } from "@juliacomputing/dyad-common";
import { formatDyad } from "@juliacomputing/dyad-parser";

const cmdLog = debug("codegen:library");

export interface CreateOptions {
  deps?: Record<string, PackageEntry>;
  contents?: Record<string, string>;
  uuid?: string;
}

export interface AuthorInformation {
  name: string;
  email: string;
}
const ALLOWLIST_FILES = new Set([".gitignore", ".git", ".DS_Store"]);
/**
 * This function creates a new Dyad library.  This effectively creates a new
 * Julia package but also adds some Dyad specific boilerplate as well.
 *
 * @param library The name of the library to create
 * @param fs File system to write files to
 * @param outputdir Directory on file system where file will be written
 * @param author Information on the author of this library
 */
export async function createLibrary(
  library: string,
  fs: FileSystemInterface,
  outputdir: string,
  author: AuthorInformation,
  options?: CreateOptions
) {
  cmdLog("Creating library %s in %s", library, outputdir);

  const contents = options?.contents || defaultContents;
  const deps = options?.deps
    ? { ...defaultPackages, ...options.deps }
    : defaultPackages;

  const exists = await fs.exists(outputdir, { type: "directory" });
  if (exists) {
    // Allow empty git repositories
    const contents = (await fs.readdir(outputdir)).filter(
      (x) => !ALLOWLIST_FILES.has(x)
    );
    if (contents.length > 0) {
      throw new Error(
        `Cannot create ${outputdir} because it already exists and is not empty`
      );
    }
  } else {
    await fs.mkdir(outputdir, { recursive: true });
  }

  const generated = path.join(outputdir, "generated");
  const src = path.join(outputdir, "src");
  const test = path.join(outputdir, "test");
  const sourceDir = path.join(outputdir, sourceFolder);
  const assets = path.join(outputdir, "assets");
  const project = path.join(outputdir, "Project.toml");

  const entry = path.join(src, `${library}.jl`);

  const toml = await projectToml(library, deps, author, options ?? {});
  for (const sub of [generated, src, test, sourceDir, assets]) {
    await fs.mkdir(sub);
  }

  const entryFile = await entryFileSource(library);

  // Put a .gitkeep file in assets
  await fs.writeFile(path.join(assets, ".gitkeep"), "");
  await fs.writeFile(path.join(outputdir, ".gitignore"), gitIgnore());
  await fs.writeFile(path.join(outputdir, ".gitattributes"), gitAttributes());
  await fs.writeFile(path.join(outputdir, "README.md"), readme(library));
  await fs.writeFile(project, toml);
  await fs.writeFile(entry, entryFile);
  await fs.writeFile(path.join(test, "runtests.jl"), testSource(library));
  await initializeVSCodeSettings(fs, outputdir);

  for (const [filename, source] of Object.entries(contents)) {
    const formatted = formatDyad(source);
    if (formatted.hasValue()) {
      await fs.writeFile(path.join(sourceDir, filename), formatted.value);
    } else {
      throw new Error(
        `Unable to properly format ${filename} when creating library ${library}...this should not happen`
      );
    }
  }
}

function gitAttributes() {
  return `/generated/** linguist-generated
/docs/src/components/** linguist-generated
/docs/src/tests/** linguist-generated
/docs/src/types/** linguist-generated
/test/snapshots/** linguist-generated
Manifest*.toml linguist-generated`;
}

function gitIgnore() {
  return `/docs/build/
*.jl.*.cov
*.jl.cov
*.jl.mem
/Manifest*.toml
/docs/Manifest*.toml
`;
}

async function projectToml(
  library: string,
  deps: Record<string, PackageEntry>,
  author: AuthorInformation,
  options: CreateOptions
) {
  const id = options?.uuid ?? v4();
  const user = author;
  const dsection: string[] = [];
  const csection: string[] = [];
  const esection: string[] = [];
  const targets: Set<string> = new Set();
  // Loop over all dependencies
  for (const [pname, entry] of Object.entries(deps)) {
    const restricted = entry.appliesTo && entry.appliesTo.length > 0;

    // Should this go in the main dependencies section?  If so, add it to
    // `dsection`, otherwise add it to the Extras section `esection`.
    if (restricted) {
      esection.push(`${pname} = "${entry.uuid}"`);
      for (const app of entry.appliesTo ?? []) {
        targets.add(app);
      }
    } else {
      dsection.push(`${pname} = "${entry.uuid}"`);
    }
    // Is there a compat for this, then add it to compats (`csection`)
    if (entry.compat) {
      csection.push(`${pname} = "${entry.compat}"`);
    }
  }
  const tlist = [...targets];
  tlist.sort();
  const tsection = tlist.map((target) =>
    Object.entries(deps)
      .filter((e) => e[1].appliesTo && e[1].appliesTo.includes(target))
      .map((e) => e[0])
  );

  return `name = "${library}"
uuid = "${id}"
authors = ["${user.name} <${user.email}>"]
version = "0.1.0"

[deps]
${dsection.join("\n")}

[compat]
${csection.join("\n")}

[extras]
${esection.join("\n")}

[targets]
${tlist.map((t, i) => `${t} = ${JSON.stringify(tsection[i])}`).join("\n")}
`;
}

function entryFileSource(library: string) {
  return `module ${library}

include("../generated/types.jl")
include("../generated/definitions.jl")
include("../generated/experiments.jl")
include("../generated/precompilation.jl")
    
end # module ${library}`;
}

function testSource(library: string) {
  return `
using ${library}
using Test
    
include("../generated/tests.jl")`;
}

function readme(library: string) {
  return `# ${library}
  
## Getting Started
  
This library was created with the Dyad Studio VS Code extension.  Your Dyad
models should be placed in the \`dyad\` directory and the files should be
given the \`.dyad\` extension.  Several such files have already been placed
in there to get you started.  The Dyad compiler will compile the Dyad models
into Julia code and place it in the \`generated\` folder.  Do not edit the
files in that directory or remove/rename that directory.

A complete tutorial on using Dyad Studio can be found [here](#).  But you
can run the provided example models by doing the following:

1. Run \`Julia: Start REPL\` from the command palette.

2. Type \`]\`.  This will take you to the package manager prompt.

3. At the \`pkg>\` prompt, type \`instantiate\` (this downloads all the Julia libraries
   you will need, and the very first time you do it it might take a while).

4. From the same \`pkg>\` prompt, type \`test\`.  This will test to make sure the models
   are working as expected.  It may also take some time but you should eventually
   see a result that indicates 2 of 2 tests passed.

5. Use the \`Backspace\`/\`Delete\` key to return to the normal Julia REPL, it should
   look like this: \`julia>\`.

6. Type \`using ${library}\`.  This will load your model library.

7. Type \`World()\` to run a simulation of the \`Hello\` model.  The first time you run it,
   this might take a few seconds, but each successive time you run it, it should be very fast.

8. To see simulation results type \`using Plots\` (and answer \`y\` if asked if you want
   to add it as a dependency).

9. To plot results of the \`World\` simulation, simply type \`plot(World())\`.

10. You can plot variations on that simulation using keyword arguments.  For example,
    try \`plot(World(stop=20, k=4))\`.
`;
}

async function initializeVSCodeSettings(
  fs: FileSystemInterface,
  outputdir: string
) {
  // Write settings into new directory **before opening it** This means the
  // Julia extension will automatically load the correct environment!
  await fs.mkdir(path.join(outputdir, ".vscode"));
  await fs.writeFile(
    path.join(outputdir, ".vscode", "settings.json"),
    JSON.stringify(
      {
        "julia.environmentPath": "${workspaceFolder}",
        "julia.NumThreads": "auto",
        "files.autoSave": "off",
      },
      null,
      4
    )
  );
}
