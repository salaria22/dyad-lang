import { baseLibraryName } from "@juliacomputing/dyad-common";
import { InMemoryFileSystem } from "../../providers/memfs.js";
import { libraryEntity, Workspace } from "../../workspace/index.js";
import { loadModulesFromFS } from "../../workspace/utils.test.js";
import { renderDocumenterDocumentation } from "./documenter.js";
import { documenterOptions } from "./options.js";
import { createLibrary } from "../library/create.js";
import fs from "fs";
import path from "path";
import os from "os";
import { dyadWatchTargets, NodeAsyncFileSystem } from "../../node.js";

describe("Test documenter functionality", () => {
  test("Test Documenter functionality on SampleComponents root module", async () => {
    const { workspace } = await loadModulesFromFS({
      sample: "SampleComponents",
    });

    try {
      const fsys = new InMemoryFileSystem();
      const entity = libraryEntity("SampleComponents");
      const problems = await renderDocumenterDocumentation(
        workspace.query.bind(workspace),
        entity,
        fsys,
        documenterOptions
      );
      expect(problems).toEqual([]);
      expect(fsys.toJSON()).toMatchSnapshot();
    } finally {
      workspace.close();
    }
  });
  test("Test Documenter functionality on Dyad root module", async () => {
    const { workspace } = await loadModulesFromFS({});

    try {
      const fsys = new InMemoryFileSystem();
      const entity = libraryEntity(baseLibraryName);
      const problems = await renderDocumenterDocumentation(
        workspace.query.bind(workspace),
        entity,
        fsys,
        documenterOptions
      );
      expect(problems).toEqual([]);
      expect(fsys.toJSON()).toMatchSnapshot();
    } finally {
      workspace.close();
    }
  });
  test("Test Documenter on freshly created library", async () => {
    let tmpDir = "";
    const workspace = await Workspace.create();
    try {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `create-docs`));
      console.log("tmpDir = ", tmpDir);
      const tsys = new NodeAsyncFileSystem(tmpDir, dyadWatchTargets);
      await createLibrary("Basic", tsys, ".", {
        name: "Test User",
        email: "test.user@juliahub.com",
      });

      await workspace.registerProvider(tsys);

      const fsys = new InMemoryFileSystem();
      const readme = await tsys.readFile("README.md");
      await fsys.writeFile("README.md", readme);
      const entity = libraryEntity("Basic");
      const problems = await renderDocumenterDocumentation(
        workspace.query.bind(workspace),
        entity,
        fsys,
        documenterOptions
      );
      expect(problems).toEqual([]);
      expect(fsys.toJSON()).toMatchSnapshot();
    } finally {
      workspace.close();
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});
