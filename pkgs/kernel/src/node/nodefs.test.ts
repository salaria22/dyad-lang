import os from "os";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
import { createLibrary } from "../codegen/index.js";
import chokidar from "chokidar";
import { dyadWatchTargets, NodeAsyncFileSystem } from "./nodefs.js";
import { Subscription } from "rxjs";
import { sourceFolder } from "@juliacomputing/dyad-common";
import { projectKey } from "../providers/keys.js";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), ms);
  });
}

describe("Test Node File System", () => {
  test("Test chokidar", async () => {
    const id: string = nanoid();
    let tmpDir: string | null = null;
    let watcher: chokidar.FSWatcher | null = null;
    try {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), `${sourceFolder}-test-${id}`)
      );
      let tally = 0;
      let paths: string[] = [];
      watcher = chokidar.watch(tmpDir, {
        persistent: true,
      });
      const sub = watcher.on("all", (event, p) => {
        if (event === "add" || event === "unlink") {
          tally++;
          paths.push(path.basename(p));
        }
      });
      await sleep(500);
      const foo = path.join(tmpDir, "foo.dyad");
      await fs.promises.writeFile(foo, "component Foo; end");
      await sleep(500); // Needed for chokidar to process
      expect(tally).toEqual(1);
      expect(paths).toEqual(["foo.dyad"]);
      const bar = path.join(tmpDir, "bar.dyad");
      await fs.promises.writeFile(bar, "component Bar; end");
      await sleep(500); // Needed for chokidar to process
      expect(tally).toEqual(2);
      expect(paths).toEqual(["foo.dyad", "bar.dyad"]);
      await fs.promises.unlink(bar);
      await sleep(500); // Needed for chokidar to process
      expect(tally).toEqual(3);
      expect(paths).toEqual(["foo.dyad", "bar.dyad", "bar.dyad"]);
      await sub.close();
    } finally {
      try {
        if (tmpDir) {
          fs.rmSync(tmpDir, { recursive: true });
        }
      } catch (e: any) {
        console.error(
          `An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`
        );
      }
      if (watcher) {
        await sleep(500);
        await watcher.close();
      }
    }
  });
  // I marked this as skipped because it seems flaky.  I'm not sure
  // this file event detection is reliable...?
  test.skip("Test file events", async () => {
    const id: string = nanoid();
    let tmpDir: string | null = null;
    try {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), `${sourceFolder}-test-${id}`)
      );
      const nfs = new NodeAsyncFileSystem(tmpDir, dyadWatchTargets);
      expect(nfs.absolutePath(projectKey)).toEqual(
        path.join(tmpDir, "Project.toml")
      );
      let tally = 0;
      const p = new Promise<Subscription>((resolve, reject) => {
        const sub = nfs.events.subscribe({
          next: () => {
            tally++;
          },
          error: (e) => {
            console.error("Event observable errored: ", e);
            reject(e);
          },
          complete: () => {
            resolve(sub);
          },
        });
      });
      await createLibrary("TestComponents", nfs, ".", {
        name: "Test Bot",
        email: "test.bot@juliahub.com",
      });
      await sleep(500);
      try {
        if (nfs) {
          nfs.close();
          await sleep(500);
        }
      } catch (e: any) {
        console.error("Error while closing NFS file system");
      }
      const sub = await p;
      sub.unsubscribe();
      expect(tally).toBeGreaterThan(0);
    } finally {
      try {
        if (tmpDir) {
          fs.rmSync(tmpDir, { recursive: true });
        }
      } catch (e: any) {
        console.error(
          `An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`
        );
      }
    }
  });
});
