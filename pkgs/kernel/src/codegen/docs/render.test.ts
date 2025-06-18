import { isComponentDefinition } from "@juliacomputing/dyad-ast";
import { instantiateModel } from "../../instantiate/model.js";
import { definitionEntity } from "../../workspace/index.js";
import {
  assertHasResult,
  loadModulesFromFS,
} from "../../workspace/utils.test.js";
import { generateIcon } from "../icons/icon.js";
import { renderComponentMarkdown } from "./component.js";
import { documenterOptions } from "./options.js";
import { generateDiagram } from "../icons/diagram.js";
import { flattenDefinitionEntity } from "../../workspace/selectors/flatten.js";
import { getDefinitionNode } from "../../workspace/selectors/nodes.js";

describe("Rendering tests", () => {
  test("Test rendering a single component definition", async () => {
    const { workspace } = await loadModulesFromFS({
      sample: "SampleComponents",
    });

    try {
      const entity = definitionEntity("SampleComponents", [], "Hello");
      const def = assertHasResult(workspace.query(getDefinitionNode(entity)));
      const flat = assertHasResult(
        workspace.query(flattenDefinitionEntity(entity, new Set()))
      );
      expect(isComponentDefinition(def)).toEqual(true);
      expect(isComponentDefinition(flat)).toEqual(true);

      if (isComponentDefinition(def) && isComponentDefinition(flat)) {
        const instance = assertHasResult(
          instantiateModel(def, {}, null, workspace.query.bind(workspace))
        );
        const icon = assertHasResult(
          await generateIcon(
            {},
            def,
            def.name.value,
            0,
            workspace.query.bind(workspace)
          )
        );
        const diagram = assertHasResult(
          await generateDiagram(
            instance.name.value,
            instance,
            workspace.query.bind(workspace)
          )
        );

        const text = renderComponentMarkdown(
          documenterOptions,
          instance,
          def,
          flat,
          [],
          {},
          workspace.query.bind(workspace),
          icon,
          diagram
        );
        expect(text.value).toMatchSnapshot();
      }
    } finally {
      workspace.close();
    }
  });
});
