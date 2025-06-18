import debug from "debug";
import path from "path";
import util from "util";
import { exec } from "child_process";
import { performCompile } from "./compile.js";
import { createLibrary } from "@juliacomputing/dyad-kernel";
import {
  dyadWatchTargets,
  NodeAsyncFileSystem,
} from "@juliacomputing/dyad-kernel/node";

export interface Options {
  debug: string;
  dir: string;
}

const execute = util.promisify(exec);

const cmdLog = debug("cli:create");

/**
 * This function creates a new Dyad library.  This effectively creates a new
 * Julia package but also adds some Dyad specific boilerplate as well.
 *
 * @param library The name of the library to create
 * @param options Options for the creation process
 */
export async function performLibraryCreation(
  library: string,
  options: Options
) {
  // If the debug option was enabled, enabled the debugging output channel.
  // This can also be done via the `DEBUG` environment variable (without the
  // command line flag).
  if (options.debug !== "") {
    debug.enable(options.debug);
  }
  let authors = { name: "", email: "" };
  try {
    authors = await author();
  } catch {
    cmdLog("Unable to determine current git user, author info will be blank");
  }
  const outputdir = path.join(options.dir, library);

  const nfs = new NodeAsyncFileSystem(outputdir, dyadWatchTargets);

  cmdLog("Creating library %s in %s", library, outputdir);
  await createLibrary(library, nfs, ".", authors);
  cmdLog("  ...library created, now performing initial compliation...");
  // Note: we use `project: "auto"` here because the library is guaranteed to have
  // no external dependencies (given that we have just created it).
  await performCompile(outputdir, { debug: options.debug, watch: false });
  cmdLog("  ...initial compilation finished");
}

async function author() {
  const name = await execute("git config --global user.name");
  const email = await execute("git config --global user.email");
  return {
    name: name.stdout.trim(),
    email: email.stdout.trim(),
  };
}
