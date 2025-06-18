import { sourceKey } from "@juliacomputing/dyad-ast";
import {
  InMemoryLibraryProvider,
  parseProject,
  stringifyProject,
} from "./index.js";
import { ProviderKey, projectKey } from "./keys.js";
import { buf2str } from "@juliacomputing/dyad-common";

export interface TestFileEvent {
  library: string;
  module: string[];
  added: ProviderKey[];
  changed: ProviderKey[];
  deleted: ProviderKey[];
}

function toKey(filename: string) {
  return sourceKey(filename, []);
}

describe("Test TOML parsing and stringification", () => {
  test("Test parsing", () => {
    const proj = parseProject(`name = 'RLC'
uuid = 'abc123'
authors = []
version = '0.1.0'`);
    expect(proj.name).toEqual("RLC");
    expect(proj.uuid).toEqual("abc123");
    expect(proj.version).toEqual("0.1.0");
    expect(proj.authors).toEqual([]);
  });
  test("Test stringify", () => {
    const result = stringifyProject({
      name: "RLC",
      uuid: "abc123",
      authors: [],
      version: "0.1.0",
    });
    expect(result).toEqual(`name = 'RLC'
uuid = 'abc123'
authors = [
  
]
version = '0.1.0'`);
  });
});
describe("Test AbstractFileSystem", () => {
  test("Test in memory library provider", async () => {
    const provider = new InMemoryLibraryProvider({
      name: "RLC",
      uuid: "abc123",
      authors: [],
      version: "0.1.0",
    });

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

    await provider.init();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      library: "RLC",
      module: [],
      added: [projectKey],
      changed: [],
      deleted: [],
    });

    const init = await provider.set(
      sourceKey("foo.dyad", []),
      "connector begin end"
    );
    expect(events).toHaveLength(2);
    expect(init.mutated).toEqual(false);
    expect(events[1]).toEqual({
      library: "RLC",
      module: [],
      added: ["foo.dyad"].map(toKey),
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
      changed: ["foo.dyad"].map(toKey),
      deleted: [],
    });
    const content = await provider.get(sourceKey("foo.dyad", []));
    expect(buf2str(content)).toEqual(
      "connector begin potential v::Voltage end"
    );
    const firstDel = await provider.del(sourceKey("foo.dyad", []));
    expect(events[4]).toEqual({
      library: "RLC",
      module: [],
      added: [],
      changed: [],
      deleted: ["foo.dyad"].map(toKey),
    });
    expect(firstDel.mutated).toEqual(true);
    const secondDel = await provider.del(sourceKey("foo.dyad", []));
    expect(secondDel.mutated).toEqual(false);
    sub.unsubscribe();
  });
});
