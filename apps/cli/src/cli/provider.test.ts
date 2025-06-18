import path from "path";
import { execSync } from "child_process";
import {
  InMemoryLibraryProvider,
  ProviderKey,
} from "@juliacomputing/dyad-kernel";
import {
  dyadWatchTargets,
  NodeAsyncFileSystem,
} from "@juliacomputing/dyad-kernel/node";
import { sourceKey } from "@juliacomputing/dyad-ast";
import { firstValueFrom } from "rxjs";
import { buf2str } from "@juliacomputing/dyad-common";

export interface TestFileEvent {
  library: string;
  module: string[];
  added: ProviderKey[];
  changed: ProviderKey[];
  deleted: ProviderKey[];
}

describe("Test AbstractFileSystem", () => {
  const asKey = (x: string) => sourceKey(x, []);
  test("Test in memory library provider", async () => {
    const provider = new InMemoryLibraryProvider({
      name: "RLC",
      authors: [],
      version: "0.1.0",
      uuid: "abc-RLC",
    });
    await provider.init();
    const events: Array<TestFileEvent> = [];
    const sub = provider.events.subscribe((event) => {
      events.push({
        library: "RLC",
        module: [],
        added: event.added,
        changed: event.changed,
        deleted: event.deleted,
      });
    });
    expect(events).toHaveLength(1);
    const init = await provider.set(
      sourceKey("foo.dyad", []),
      "connector begin end"
    );
    expect(events).toHaveLength(2);
    expect(init.mutated).toEqual(false);
    expect(events[1]).toEqual({
      library: "RLC",
      module: [],
      added: ["foo.dyad"].map(asKey),
      changed: [],
      deleted: [],
    });
    const firstSet = await provider.set(
      sourceKey("foo.dyad", []),
      "connector begin end"
    );
    expect(events).toHaveLength(3);
    expect(firstSet.mutated).toEqual(true);
    const secondSet = await provider.set(
      sourceKey("foo.dyad", []),
      "connector begin potential v::Voltage end"
    );
    expect(events).toHaveLength(4);
    expect(secondSet.mutated).toEqual(true);
    expect(events[2]).toEqual({
      library: "RLC",
      module: [],
      added: [],
      changed: ["foo.dyad"].map(asKey),
      deleted: [],
    });
    const content = await provider.get(sourceKey("foo.dyad", []));
    expect(buf2str(content)).toEqual(
      "connector begin potential v::Voltage end"
    );
    const firstDel = await provider.del(sourceKey("foo.dyad", []));
    expect(events[3]).toEqual({
      library: "RLC",
      module: [],
      added: [],
      deleted: [],
      changed: ["foo.dyad"].map(asKey),
    });
    expect(firstDel.mutated).toEqual(true);
    const secondDel = await provider.del(sourceKey("foo.dyad", []));
    expect(secondDel.mutated).toEqual(false);
    sub.unsubscribe();
  });
  test("Test Node fs library provider", async () => {
    const packageDirectory = path.join(root(), "apps", "cli", "samples", "rlc");
    const fs = new NodeAsyncFileSystem(packageDirectory, dyadWatchTargets);
    try {
      await fs.init();
      const name = (await firstValueFrom(fs.project())).name;
      expect(name).toEqual("RLC");
      const files = await fs.list(sourceKey("*", []));
      expect(files).toEqual(
        [
          "capacitor.dyad",
          "constant.dyad",
          "diode.dyad",
          "ground.dyad",
          "inductor.dyad",
          "pin.dyad",
          "resistor.dyad",
          "step.dyad",
          "systems.dyad",
          "twopin.dyad",
          "types.dyad",
        ].map(asKey)
      );
      const data = await fs.get(sourceKey("systems.dyad", []));
      expect(data.byteLength).toEqual(717);
    } finally {
      fs.close();
    }
  });
});

/**
 * This function finds the root of the git repository (assuming you are in a directory of a git repository)
 * using the **synchronous** function `execSync`.
 * @returns The path to the root of the git repository
 */
export function root(): string {
  return execSync("git rev-parse --show-toplevel").toString().trim();
}
