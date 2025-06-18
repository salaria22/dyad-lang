import {
  isComponentDefinition,
  isConnectorDefinition,
} from "@juliacomputing/dyad-ast";
import { lastValue } from "../providers/last.js";
import { queryParsingProblems, queryType } from "./index.js";
import {
  assertHasResult,
  assertJust,
  loadModulesFromFS,
} from "./utils.test.js";
import { instantiateModel } from "../instantiate/model.js";

describe("Test semantics of common qualifiers", () => {
  test("Test CommonTests library", async () => {
    const { workspace, com } = await loadModulesFromFS({
      com: "CommonTests",
    });
    try {
      const mods = lastValue(com.modules());
      expect(mods).toEqual([[]]);

      const con = assertJust(
        workspace.query(queryType("CommonTests", [], "HydraulicPort"))
      );
      expect(isConnectorDefinition(con)).toEqual(true);

      const problems = workspace.query(queryParsingProblems());
      expect(problems).toHaveLength(0);

      const res = assertJust(
        workspace.query(queryType("CommonTests", [], "System1"))
      );
      expect(isComponentDefinition(res)).toEqual(true);
      if (isComponentDefinition(res)) {
        assertHasResult(
          instantiateModel(res, {}, null, workspace.query.bind(workspace)),
          false
        );
      }
    } finally {
      workspace.close();
    }
  });
});
