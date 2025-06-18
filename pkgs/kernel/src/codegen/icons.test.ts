import {
  negElectricalPin,
  posElectricalPin,
  rlc_sources,
} from "./samples/rlc.js";
import { queryType } from "../workspace/index.js";
import { assetKey, isComponentDefinition } from "@juliacomputing/dyad-ast";
import { generateIcon } from "./icons/icon.js";
import { generateDiagram } from "./icons/diagram.js";
import { loadWorkspace } from "./testing.js";
import debug from "debug";
import { assertHasResult } from "../workspace/utils.test.js";
import { instantiateModel } from "../instantiate/model.js";

const svgLog = debug("codegen:svg");

describe("Test SVG generation", () => {
  test("Test RLC Icon generation", async () => {
    /* Create a workspace with a single library */
    const { workspace, inmem } = await loadWorkspace("RLC", rlc_sources);

    const def = workspace.query(queryType("RLC", [], "Resistor"));
    expect(def.isJust()).toEqual(true);
    const definition = def.unsafeCoerce();
    expect(isComponentDefinition(definition)).toEqual(true);
    if (isComponentDefinition(definition)) {
      // First try to generate icon without assets present
      const icon = await generateIcon(
        { instance: "root" },
        definition,
        "default",
        0,
        workspace.query.bind(workspace)
      );
      expect(icon.problems()).toHaveLength(2);
      expect(assertHasResult(icon)).toMatchSnapshot();

      // Now add the assets required
      const resp1 = await inmem.set(assetKey("p_pin.svg"), posElectricalPin);
      await workspace.waitForId(resp1.transactionId);
      const resp2 = await inmem.set(assetKey("n_pin.svg"), negElectricalPin);
      await workspace.waitForId(resp2.transactionId);
      svgLog("Calling generateIcon");
      const icon2 = await generateIcon(
        {
          instance: "root",
        },
        definition,
        "default",
        0,
        workspace.query.bind(workspace)
      );
      svgLog("%s", icon2);
      expect(icon2.problems()).toEqual([]);
      expect(assertHasResult(icon2)).toMatchSnapshot();
    }
  });
  // Add diagram generation for RLCModel
  test("Test RLC Icon generation", async () => {
    /* Create a workspace with a single library */
    const { workspace, inmem } = await loadWorkspace("RLC", rlc_sources);

    await inmem.set(assetKey("p_pin.svg"), posElectricalPin);
    await inmem.set(assetKey("n_pin.svg"), negElectricalPin);

    const def = workspace.query(queryType("RLC", [], "RLCModel"));
    expect(def.isJust()).toEqual(true);
    const definition = def.unsafeCoerce();
    expect(isComponentDefinition(definition)).toEqual(true);
    if (isComponentDefinition(definition)) {
      const icon = await generateIcon(
        { instance: "root" },
        definition,
        "default",
        0,
        workspace.query.bind(workspace)
      );
      svgLog("%s", icon);
      expect(assertHasResult(icon)).toMatchSnapshot();
      expect(icon.problems()).toEqual([]);

      const minst = instantiateModel(
        definition,
        {},
        null,
        workspace.query.bind(workspace)
      );
      expect(minst.problems()).toEqual([]);
      const instance = assertHasResult(minst);
      const diagram = assertHasResult(
        await generateDiagram("root", instance, workspace.query.bind(workspace))
      );
      svgLog("%s", diagram);
      expect(diagram).toMatchSnapshot();
    }
  });
});
