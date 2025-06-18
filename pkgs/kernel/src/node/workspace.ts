import debug from "debug";
import * as path from "path";
import * as fs from "fs";
import { firstValueFrom } from "rxjs";
import { run_script } from "./run.js";
import { dyadWatchTargets, NodeAsyncFileSystem } from "./nodefs.js";
import { Workspace } from "../workspace/index.js";
import { ProjectTOML, parseProject } from "../providers/project.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";

const compileLog = debug("workspace:init");

export async function initializeWorkspace(pkgdir: string, project?: string) {
  const nfs = new NodeAsyncFileSystem(pkgdir, dyadWatchTargets);

  const workspace = await Workspace.create();
  const juliaExe = "julia"; // Allow this to be overridden somehow?

  // Extract project information
  compileLog("Creating file system provider at %s", pkgdir);
  let proj: ProjectTOML;

  // Always load the base project info from nfs first - this contains the core metadata
  // (name, uuid, version, authors) that we want to preserve
  const baseProj = await firstValueFrom(nfs.project());

  if (project) {
    const projectFile = resolveProjectFile(project); // see below for definition.  this handles directories, files, and shared environments.
    try {
      // Load the project file from the specified project directory
      const contents = (await fs.promises.readFile(projectFile)).toString();
      const projectDirProj = parseProject(contents);

      // Create merged project info:
      // - Use all core metadata (name, uuid, version, authors) from the base project
      // - Use only the dependencies from the project directory's Project.toml
      proj = {
        ...baseProj,
        deps: projectDirProj.deps ?? {},
      };
    } catch (e) {
      throw new Error(
        `Error opening project file ${projectFile}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  } else {
    compileLog("No project directory was provided, using package directory");
    // If no project directory specified, just use the base project as is
    proj = baseProj;
  }
  compileLog(`  Project name: %s`, proj.name);

  // if `proj.deps` is undefined, return an empty object
  // otherwise, deps is the dependencies from the project file
  const deps = proj.deps ?? {};
  // if `project` is defined, use it as the project argument
  // otherwise, use the package directory as the project argument
  const projectArg = project ?? ".";

  for (const dep of Object.keys(deps)) {
    try {
      compileLog(
        `Processing dependency '${dep}' to check if it's a Dyad component library`
      );

      const possibleDir = await isDyadPackage(
        juliaExe,
        projectArg,
        pkgdir,
        dep,
        compileLog
      );

      await possibleDir.ifJust(async (dir) => {
        compileLog("  Dyad component library '%s' is in '%s'", dep, dir);

        const dfs = new NodeAsyncFileSystem(dir, dyadWatchTargets);
        const id = await workspace.registerProvider(dfs);
        await workspace.waitForId(id);
        const dproj = await firstValueFrom(dfs.project());
        compileLog(
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

  // Register the NFS provider with the workspace and wait until that
  // registration is completed.
  compileLog(`Registering library provider for ${pkgdir}`);
  const id = await workspace.registerProvider(nfs);
  await workspace.waitForId(id);

  const projectName = proj.name;
  return { workspace, nfs, proj, projectName };
}

export function resolveProjectFile(project: string): string {
  /*
  We have to manually load the Project.toml file.
  There are three potential things it can be:
  - A path to a directory containing a Project.toml file
  - A path to a Project.toml file
  - A Julia shared global environment name (starts with '@')

  The first two cases are simply handle-able.  For the third, 
  we search for the Project.toml file in the user's ~/.julia/environments/.
  (This is just where we assume the depot path is.  If it is not there then it's fine.)
  */
  if (project.startsWith("@")) {
    // Remove the '@' and search in ~/.julia/environments/
    const envName = project.slice(1);
    const projectFile = path.join(
      process.env.HOME || process.env.USERPROFILE || "~",
      ".julia",
      "environments",
      envName,
      "Project.toml"
    );
    if (!fs.existsSync(projectFile)) {
      throw new Error(`Project file not found at ${projectFile}`);
    }
    compileLog(`Loading project from Julia shared environment: ${projectFile}`);
    return projectFile;
  } else if (
    !project.endsWith("Project.toml") &&
    fs.existsSync(project) &&
    fs.lstatSync(project).isDirectory()
  ) {
    // Project is a directory, append Project.toml
    const projectFile = path.join(project, "Project.toml");
    if (!fs.existsSync(projectFile)) {
      throw new Error(`Project.toml not found in directory ${project}`);
    }
    compileLog(`Loading project from directory: ${projectFile}`);
    return projectFile;
  } else if (project.endsWith("Project.toml")) {
    // Project is a Project.toml file
    const projectFile = project;
    if (!fs.existsSync(projectFile)) {
      throw new Error(`Project file not found at ${projectFile}`);
    }
    compileLog(`Loading project from file: ${projectFile}`);
    return projectFile;
  } else {
    throw new Error(`Invalid project argument: ${project}`);
  }
}

/**
 * Returns the absolute path on the file system of the Dyad library named by
 * `dep` _if_ it is a Dyad library.
 *
 * @param projectDirectory
 * @param dep
 * @returns
 */
export async function isDyadPackage(
  juliaExe: string,
  projectArg: string,
  projectDirectory: string,
  dep: string,
  workspaceLog: debug.Debugger
): Promise<Maybe<string>> {
  const stdout = await run_script(
    juliaExe,
    [
      `--project=${projectArg}`,
      `--startup=no`,
      "-e",
      `print(Base.find_package("${dep}"))`,
    ],
    projectDirectory
  );

  const packagePath = stdout.trim();

  if (packagePath === "nothing" || packagePath === "") {
    workspaceLog(
      `Unable to locate directory for dependency '${dep}' via Base.find_package. Skipping checks to see if it is a Dyad component library.  You may need to \`Pkg.instantiate()\` your Julia project.`
    );
    return Nothing;
  }

  let dir: string;
  try {
    // Base.find_package returns a path like /path/to/package/src/Package.jl
    // Two path.dirname calls should get to the package root directory.
    dir = path.dirname(path.dirname(packagePath));
  } catch (pathError) {
    workspaceLog(
      `Error processing path from Base.find_package for '%s' (raw output: '%s', processed path: '%s'): %s. Skipping Dyad checks.`,
      dep,
      stdout,
      packagePath,
      pathError instanceof Error ? pathError.message : String(pathError)
    );
    return Nothing;
  }

  // Criterion 1: Does the dep have a top level (MyPackage/dyad) folder?
  const dyadFolderPath = path.join(dir, "dyad");
  let hasDyadFolder = false;
  try {
    if (
      fs.existsSync(dyadFolderPath) &&
      fs.lstatSync(dyadFolderPath).isDirectory()
    ) {
      hasDyadFolder = true;
      workspaceLog(
        `  Criteria met for '%s': Found 'dyad' folder at '%s'`,
        dep,
        dyadFolderPath
      );
    }
  } catch (fsError) {
    workspaceLog(
      `  Filesystem error while checking for 'dyad' folder for '%s' at '%s': %s. Assuming no dyad folder.`,
      dep,
      dyadFolderPath,
      fsError instanceof Error ? fsError.message : String(fsError)
    );
  }

  // Criteria 2 & 3: Project.toml checks
  const depProjectTomlPath = path.join(dir, "Project.toml");
  let hasDyadSection = false;
  let hasDyadTag = false;

  if (fs.existsSync(depProjectTomlPath)) {
    try {
      const depProjectContents = (
        await fs.promises.readFile(depProjectTomlPath)
      ).toString();
      const parsedDepProject = parseProject(depProjectContents);

      if (parsedDepProject && typeof parsedDepProject === "object") {
        // Criterion 2: Does the dep have a `dyad` section at the top level?
        if (parsedDepProject.dyad !== undefined) {
          hasDyadSection = true;
          workspaceLog(
            `  Criteria met for '%s': Found 'dyad' section in Project.toml at '%s'`,
            dep,
            depProjectTomlPath
          );
        }

        // Criterion 3: Does the dep have a `tags` array at the top level, which has a "dyad" entry?
        if (
          Array.isArray(parsedDepProject.tags) &&
          parsedDepProject.tags.includes("dyad")
        ) {
          hasDyadTag = true;
          workspaceLog(
            `  Criteria met for '%s': Found "dyad" in 'tags' array in Project.toml at '%s'`,
            dep,
            depProjectTomlPath
          );
        }
      } else {
        workspaceLog(
          `  Parsed Project.toml for '%s' is not an object or is null. Skipping 'dyad' section and 'tags' checks.`,
          dep
        );
      }
    } catch (tomlError) {
      workspaceLog(
        `  Error reading or parsing Project.toml for dependency '%s' at '%s': %s. Skipping TOML-based Dyad checks.`,
        dep,
        depProjectTomlPath,
        tomlError instanceof Error ? tomlError.message : String(tomlError)
      );
      console.warn(
        `Warning: Could not read/parse Project.toml for dependency '${dep}' at '${depProjectTomlPath}'. TOML-based Dyad checks skipped.`
      );
    }
  } else {
    workspaceLog(
      `  No Project.toml found for dependency '%s' at '%s'. Skipping TOML-based Dyad checks.`,
      dep,
      depProjectTomlPath
    );
  }

  const isDyad = hasDyadFolder || hasDyadSection || hasDyadTag;
  if (isDyad) {
    workspaceLog(
      `Identified Dyad component library: '%s' (folder: %s, section: %s, tag: %s)`,
      dep,
      hasDyadFolder,
      hasDyadSection,
      hasDyadTag
    );
    return Just(dir);
  }
  workspaceLog(
    `Dependency '%s' (path: %s) is not identified as a Dyad component library based on the criteria. Skipping Dyad-specific registration.`,
    dep,
    dir
  );

  return Nothing;
}
