import { sourceKey } from "@juliacomputing/dyad-ast";
import { projectRLC } from "../codegen/testing.js";
import { InMemoryLibraryProvider, projectKey } from "../providers/index.js";
import { Workspace } from "./workspace.js";
import {
  assertJust,
  electricalConnector,
  electricalTypes,
} from "./utils.test.js";
import { queryLibrary, queryType } from "./index.js";
import { buf2str } from "@juliacomputing/dyad-common";

describe("Test UndoBuffer", () => {
  test("Basic undo test", async () => {
    const workspace = await Workspace.create();

    try {
      const RLC = new InMemoryLibraryProvider();
      await RLC.set(projectKey, projectRLC);
      const id1 = await workspace.registerProvider(RLC);
      await workspace.waitForId(id1);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      expect(workspace.registerProvider(RLC)).rejects.toHaveProperty(
        "message",
        "A project with the name RLC already exists"
      );
      const txn1 = await RLC.set(sourceKey("types.dyad", []), electricalTypes);
      const txn2 = await RLC.set(
        sourceKey("pin.dyad", []),
        electricalConnector
      );

      await workspace.waitForId(txn1.transactionId);
      await workspace.waitForId(txn2.transactionId);

      assertJust(workspace.query(queryLibrary("RLC")));

      const pin = assertJust(workspace.query(queryType("RLC", [], "Pin")));

      const v1 = workspace.getVersion();

      await workspace.modify(pin, (draft) => {
        draft.name.value = "Pin2";
      });

      // Make sure the AST has been updated
      const pin2 = assertJust(workspace.query(queryType("RLC", [], "Pin2")));
      expect(pin2.name.value).toEqual("Pin2");

      const key = pin2.source;
      expect(key).not.toBeNull();
      if (key !== null) {
        const contents = buf2str(await RLC.get(key));
        expect(contents.startsWith("connector Pin2")).toEqual(true);
      }

      expect(v1).not.toEqual(workspace.getVersion());
    } finally {
      workspace.close();
    }
  });
});
