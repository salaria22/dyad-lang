import { Workspace } from "./workspace.js";
import { InMemoryLibraryProvider, projectKey } from "../providers/index.js";
import {
  getDefinitionRelations,
  getEntity,
  getFileRelations,
  isDefinitionEntity,
  queryLibrary,
  queryType,
  unparseDefinitionEntity,
} from "./index.js";
import {
  createToken,
  isFileContents,
  isParsedFile,
  ParsedFile,
  sourceKey,
} from "@juliacomputing/dyad-ast";
import { projectRLC } from "../codegen/testing.js";
import {
  assertHasResult,
  assertJust,
  electricalConnector,
  electricalTypes,
} from "./utils.test.js";
import {
  baseLibraryName,
  buf2str,
  fileExtension,
} from "@juliacomputing/dyad-common";
import { getFileNode } from "./selectors/nodes.js";

describe("Test Workspace class", () => {
  test("Test parsing and semantic analysis", async () => {
    const workspace = await Workspace.create();

    const RLC = new InMemoryLibraryProvider();
    await RLC.set(projectKey, projectRLC);
    const id1 = await workspace.registerProvider(RLC);
    await workspace.waitForId(id1);

    const nonBaseLibraryKeys = () =>
      workspace.query(({ attrs }) =>
        attrs.getMatchingEntity((x): boolean => {
          if (!isDefinitionEntity(x)) {
            return false;
          }
          const info = unparseDefinitionEntity(x);
          return info.library !== baseLibraryName;
        })
      );

    expect(nonBaseLibraryKeys()).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(workspace.registerProvider(RLC)).rejects.toHaveProperty(
      "message",
      "A project with the name RLC already exists"
    );
    const txn1 = await RLC.set(sourceKey("types.dyad", []), electricalTypes);
    await workspace.waitForId(txn1.transactionId);
    expect(nonBaseLibraryKeys()).toEqual([
      "urn:definition:RLC::Foo",
      "urn:definition:RLC::Bar",
      "urn:definition:RLC::Voltage",
      "urn:definition:RLC::Current",
    ]);

    const txn2 = await RLC.set(sourceKey("pin.dyad", []), electricalConnector);
    await workspace.waitForId(txn2.transactionId);
    expect(nonBaseLibraryKeys()).toEqual([
      "urn:definition:RLC::Foo",
      "urn:definition:RLC::Bar",
      "urn:definition:RLC::Voltage",
      "urn:definition:RLC::Current",
      "urn:definition:RLC::Pin",
    ]);

    assertJust(workspace.query(queryLibrary("RLC")));

    const pin = assertJust(workspace.query(queryType("RLC", [], "Pin")));
    const entity = workspace.query(getEntity(pin));
    expect(entity).toEqual("urn:definition:RLC::Pin"); // TODO: Fill in whatever URN this should be

    const v1 = workspace.getVersion();

    await workspace.modify(pin, (draft) => {
      draft.name.value = "Pin2";
    });

    // Make sure the AST has been updated
    const pin2 = assertJust(workspace.query(queryType("RLC", [], "Pin2")));
    expect(pin2.name.value).toEqual("Pin2");

    expect(nonBaseLibraryKeys()).toEqual([
      "urn:definition:RLC::Foo",
      "urn:definition:RLC::Bar",
      "urn:definition:RLC::Voltage",
      "urn:definition:RLC::Current",
      "urn:definition:RLC::Pin2",
    ]);

    const key = pin2.source;
    expect(key).not.toBeNull();
    if (key !== null) {
      const contents = buf2str(await RLC.get(key));
      expect(contents.startsWith("connector Pin2")).toEqual(true);
    }

    expect(v1).not.toEqual(workspace.getVersion());

    workspace.close();
  });

  test("Renaming files from AST", async () => {
    // Create a workspace
    const workspace = await Workspace.create();

    // Create an in-memory provider fo the RLC library
    const RLCProvider = new InMemoryLibraryProvider();
    // Update the Project.toml file
    await RLCProvider.set(projectKey, projectRLC);
    // Register the (empty) library
    const id1 = await workspace.registerProvider(RLCProvider);
    // Wait for registration to complete
    await workspace.waitForId(id1);

    // Try to register the provider again and ensure we get an error
    await expect(
      workspace.registerProvider(RLCProvider)
    ).rejects.toHaveProperty(
      "message",
      "A project with the name RLC already exists"
    );

    // Now add the `types.dyad` file
    const txn1 = await RLCProvider.set(
      sourceKey("types.dyad", []),
      electricalTypes
    );
    // Now add the `pin.dyad` file
    const txn2 = await RLCProvider.set(
      sourceKey("pin.dyad", []),
      electricalConnector
    );

    // Wait for those files to be processed
    await workspace.waitForId(txn1.transactionId);
    await workspace.waitForId(txn2.transactionId);

    // Ensure the library can be queried
    assertJust(workspace.query(queryLibrary("RLC")));

    const updatedName = "Pin2";
    const currentName = "Pin";

    // Ensure a component with the expected current name exists.
    const component = assertJust(
      workspace.query(queryType("RLC", [], currentName))
    );
    // Get relations for the current component
    const rels = workspace.query(getDefinitionRelations(component));
    expect(rels.kind).toEqual("def");

    // Create a transaction
    const transaction = workspace.transaction();
    if (rels.kind === "def") {
      const file = assertHasResult(
        workspace.query(getFileNode(rels.file, isFileContents))
      );
      expect(isParsedFile(file)).toEqual(true);
      if (isParsedFile(file)) {
        expect(file.source.file).toEqual("pin.dyad");
        const ent = workspace.query(getFileRelations(file));
        expect(ent).toBeDefined();
        transaction.modify(file, (f: ParsedFile) => {
          f.source = sourceKey(`${updatedName}.${fileExtension}`, []);
          f.definitions = f.definitions.map((def) => {
            if (def.name.value === currentName) {
              def.name = createToken(updatedName, null);
            }
            return def;
          });
        });
      }
    }

    await transaction.commit();

    const pin2 = assertJust(workspace.query(queryType("RLC", [], updatedName)));
    expect(pin2.name.value).toEqual(updatedName);
    expect(
      await RLCProvider.has(sourceKey(`${currentName}.${fileExtension}`, []))
    ).toBe(false);
    expect(
      await RLCProvider.has(sourceKey(`${updatedName}.${fileExtension}`, []))
    ).toBe(true);

    const txn3 = await RLCProvider.set(
      sourceKey(`${currentName}.${fileExtension}`, []),
      electricalConnector
    );

    await workspace.waitForId(txn3.transactionId);
    expect(
      await RLCProvider.has(sourceKey(`${currentName}.${fileExtension}`, []))
    ).toBe(true);

    workspace.close();
  });
});
