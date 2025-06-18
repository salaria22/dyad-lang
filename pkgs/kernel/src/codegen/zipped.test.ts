import { ZipProvider } from "../providers/index.js";
import { Workspace, queryLibrary } from "../workspace/index.js";
import { generateMTKCode } from "./mtk/index.js";
import fs from "fs";
import path from "path";

// Hack to get __dirname in ESM
import { fileURLToPath } from "url";
import { SnapshotHandler } from "./testing.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Test code generation from zipped libraries", () => {
  test("Run code generation tests on bundled Electrical.zip", async () => {
    const workspace = await Workspace.create();
    const contents = await fs.promises.readFile(
      path.join(__dirname, "samples", "Electrical.zip")
    );
    const blob = new Blob([contents]);
    const zip = new ZipProvider(blob);
    const id = await workspace.registerProvider(zip);
    await workspace.waitForId(id);

    const result = workspace.query(queryLibrary("ElectricalComponents"));
    expect(result.isJust()).toEqual(true);
    const library = result.unsafeCoerce();
    expect(library.kind).toEqual("lib");

    const problems = await generateMTKCode(
      workspace,
      library,
      [],
      new SnapshotHandler([[]])
    );
    expect(problems).toHaveLength(0);
  });
});
