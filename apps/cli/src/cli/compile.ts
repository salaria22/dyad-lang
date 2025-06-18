import debug from "debug";

import { runSingleCompilerPass } from "./single.js";
import fs from "fs";
import { exit } from "process";
import path from "path";

export interface Options {
  debug: string;
  watch: boolean;
  project?: string;
}

const cmdLog = debug("cli:perform");

/**
 * This function performs the compilation of Dyad code into Julia code. If
 * the `watch` option is enabled, then it will also wait and look for any subsequent
 * file system events and retrigger the compilations process should any valid events
 * occur.
 *
 * @param pkgdir The directory where this package is stored
 * @param options Options for the compilation process
 */
export async function performCompile(pkgdir: string, options: Options) {
  // If the debug option was enabled, enabled the debugging output channel.
  // This can also be done via the `DEBUG` environment variable (without the
  // command line flag).
  if (options.debug !== "") {
    debug.enable(options.debug);
  }

  // Resolve project path relative to CWD if provided
  const resolvedProject = options.project ? path.resolve(process.cwd(), options.project) : undefined;
  cmdLog(
    "Running compile command in directory %s with options: %j",
    pkgdir,
    { ...options, project: resolvedProject }
  );

  const outputdir = path.join(pkgdir, "src");
  cmdLog(`Compiling Dyad source into %s`, outputdir);

  // Determine if the compiler will run in "watch" mode
  if (options.watch) {
    cmdLog("Running in watch mode");
    cmdLog("  Running initial compiler pass");
    // In watch mode, we first run the compiler (if simple entered the file
    // system event watching, we'd have to wait until a file was changed before
    // triggering the compiler so we kick it off once here first).
    try {
      // Run the first pass of the compiler
      await runSingleCompilerPass(pkgdir, resolvedProject);
    } catch (err) {
      // If anything went wrong, report it to stderr.
      cmdLog("  ERROR running Dyad compiler: %s", err);
      console.error("Error running Dyad compiler (initial pass): ", err);
    } finally {
      // Whether an error occurred or not, we now watch for file system events.
      cmdLog(
        "  ...completed first pass now waiting for file events in %s",
        pkgdir
      );
      // Configure the system to watch for file system events
      fs.watch(pkgdir, { recursive: true }, async (eventType, filename) => {
        try {
          // On an event, check if it involves a relevant file type and, if so,
          // re-run the compiler.
          cmdLog("  Got a %s event on %s", eventType, filename);
          if (filename?.endsWith(".dyad") || filename?.endsWith(".toml")) {
            cmdLog("  Rerunning in response to file event");
            await runSingleCompilerPass(pkgdir, resolvedProject).catch((err) => {
              cmdLog("  ERROR running Dyad compiler: %s", err);
              console.error("Error running Dyad compiler (watching):", err);
            });
          }
        } catch (e) {
          console.error("Error during file watching: ", e);
        }
      });
    }
  } else {
    cmdLog("Running in one-pass compiler mode");
    try {
      const status = await runSingleCompilerPass(pkgdir, resolvedProject);
      exit(status);
    } catch (err) {
      console.error("Error running Dyad compiler (single pass): ", err);
      exit(1);
    }
  }
}
