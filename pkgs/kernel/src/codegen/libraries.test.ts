import fs from "fs";
import cp from "child_process";
import util from "util";
import { dyadWatchTargets, NodeAsyncFileSystem } from "../node.js";
import path from "path";
import * as rimraf from "rimraf";
import { queryLibrary, Workspace } from "../workspace/index.js";
import { createLibrary, MTK } from "./index.js";
import { isProblemSpan } from "@juliacomputing/dyad-ast";

interface LibraryInfo {
  name: string;
  deps: string[];
  tag?: string;
  skip?: boolean;
}

const standardLibraries: LibraryInfo[] = [
  {
    name: "BlockComponents",
    deps: [],
    tag: undefined,
  },
  {
    name: "ThermalComponents",
    deps: [],
    tag: undefined,
  },
  {
    name: "RotationalComponents",
    deps: ["BlockComponents"],
    tag: undefined,
  },
  {
    name: "ElectricalComponents",
    deps: ["BlockComponents", "RotationalComponents"],
    tag: undefined,
  },
  {
    name: "HydraulicComponents",
    deps: ["BlockComponents"],
    tag: undefined,
  },
  {
    name: "TranslationalComponents",
    deps: ["BlockComponents"],
    tag: undefined,
  },
  {
    name: "DyadExampleComponents",
    deps: [
      "BlockComponents",
      "TranslationalComponents",
      "RotationalComponents",
      "ElectricalComponents",
    ],
    tag: undefined,
  },
];

const checkoutDir = "test-libraries";
const minutes = 60000;

const releasePrep = process.env["RELEASE_PREP"] !== undefined;
const skipLibs = process.env["SKIP_LIBS"] !== undefined;
const compileOnly = process.env["COMPILE_ONLY"] !== undefined;

/**
 * The `RELEASE_PREP` environment variable is set by the test:release script.
 * However, when we want to publish via `yalc`, we don't want to run these
 * tests.  The problem is, we have no way of knowing whether the user ran `yalc
 * publish` or `npm publish` since the same lifecycle scripts get run in both
 * cases.  So if you run `yalc publish` you should set `SKIP_LIBS` to override
 * the `RELEASE_PREP` variable.
 *
 * If the COMPILE_ONLY flat is set, then the test libraries will be checked out
 * and the code for them will be generated, but the tests for the individual
 * libraries will not be run.
 */
const describeRelease = releasePrep && !skipLibs ? describe : describe.skip;

describeRelease("Test code generation", () => {
  // describe("Test code generation on standard libraries", () => {
  const exec = util.promisify(cp.exec);
  // Update all submodules
  rimraf.rimrafSync(checkoutDir);
  fs.mkdirSync(checkoutDir, { recursive: true });

  test(
    "Test library creation",
    async () => {
      const cnfs = new NodeAsyncFileSystem(checkoutDir, dyadWatchTargets);
      await createLibrary("TestLib", cnfs, "TestLib", {
        name: "BuildBot",
        email: "",
      });
      cnfs.close();
      const dir = path.join(checkoutDir, "TestLib");
      const opts = { cwd: dir };
      const run = async (cmd: string): Promise<string> => {
        try {
          const { stdout } = await exec(cmd, opts);
          return stdout.trim();
        } catch (e: any) {
          const ef = path.join(dir, "errors.out");
          fs.writeFileSync(ef, e.message);
          throw new Error(
            `Tests for Hello failed while running ${cmd} (see ${ef} for errors)`
          );
        }
      };
      const nfs = new NodeAsyncFileSystem(dir, dyadWatchTargets);
      const workspace = await Workspace.create();

      try {
        const id = await workspace.registerProvider(nfs);
        await workspace.waitForId(id);

        const libnode = workspace.query(queryLibrary("TestLib")).unsafeCoerce();
        const handler = new MTK.FSHandler(nfs);
        const problems = await MTK.generateMTKCode(
          workspace,
          libnode,
          [],
          handler
        );
        const descriptions = problems.map((p) => {
          const extra = p.extra;
          if (extra && isProblemSpan(extra) && extra.file && extra.span) {
            return `${extra.file.file}:${extra.span.sl}:${extra.span.sc} - ${p.type}: ${p.details}`;
          } else {
            return `${p.type} - ${p.details}`;
          }
        });
        expect(descriptions).toHaveLength(0);

        await run(`julia --project=. -e 'using Pkg; Pkg.instantiate()'`);
        if (!compileOnly) {
          // Generate docs
          // Run Julia tests
          await expect(
            run("julia --project=. -e 'using Pkg; Pkg.test()'")
          ).resolves.not.toThrow();
        }
      } finally {
        workspace.close();
        nfs.close();
      }
    },
    10 * minutes
  );
  for (const entry of standardLibraries) {
    const lib = entry.name;
    (entry.skip ? test.skip : test)(
      `Run code generation tests for ${lib}`,
      async () => {
        const dir = path.join(checkoutDir, lib);
        const opts = { cwd: dir };
        const run = async (cmd: string): Promise<string> => {
          try {
            const { stdout } = await exec(cmd, opts);
            return stdout.trim();
          } catch (e: any) {
            const ef = path.join(dir, "errors.out");
            fs.writeFileSync(ef, e.message);
            throw new Error(
              `Tests for ${lib} failed while running ${cmd} (see ${ef} for errors)`
            );
          }
        };
        // Clone the repository
        await exec(`git clone git@github.com:JuliaComputing/${lib}.git`, {
          cwd: checkoutDir,
        });
        const tag =
          entry.tag ?? (await run("git tag --sort=v:refname | tail -n 1"));
        // Checkout the latest version
        await run(`git checkout ${tag}`);
        if (entry.deps.length > 0) {
          // Update dependencies
          const spaces = entry.deps.map(
            (x) => `Pkg.PackageSpec(path="../${x}")`
          );
          await run(
            `julia --project=. -e 'using Pkg; Pkg.develop([${spaces.join(",")}])'`
          );
        }
        await run(`julia --project=. -e 'using Pkg; Pkg.instantiate()'`);

        // Configure workspace
        const nfs = new NodeAsyncFileSystem(dir, []);
        const workspace = await Workspace.create();
        const fss = [nfs];
        try {
          const id = await workspace.registerProvider(nfs);
          await workspace.waitForId(id);
          for (const dep of entry.deps) {
            const depfs = new NodeAsyncFileSystem(
              path.join(checkoutDir, dep),
              []
            );
            fss.push(depfs);
            const id = await workspace.registerProvider(depfs);
            await workspace.waitForId(id);
          }
          // Regenerate code
          const libnode = workspace.query(queryLibrary(lib)).unsafeCoerce();
          const handler = new MTK.FSHandler(nfs);
          const problems = await MTK.generateMTKCode(
            workspace,
            libnode,
            [],
            handler
          );
          const descriptions = problems.map((p) => {
            const extra = p.extra;
            if (extra && isProblemSpan(extra) && extra.file && extra.span) {
              return `${extra.file.file}:${extra.span.sl}:${extra.span.sc} - ${p.type}: ${p.details}`;
            } else {
              return `${p.type} - ${p.details}`;
            }
          });
          expect(descriptions).toHaveLength(0);
          if (!compileOnly) {
            // Generate docs
            // Run Julia tests
            await expect(
              run("julia --project=. -e 'using Pkg; Pkg.test()'")
            ).resolves.not.toThrow();
          }
        } finally {
          workspace.close();
          fss.forEach((fs) => fs.close());
        }
        // Run documenter
      },
      10 * minutes
    );
  }
});
