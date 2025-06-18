import {
  generateDiagram,
  instantiateModel,
  queryType,
} from "@juliacomputing/dyad-kernel";
import { initializeWorkspace } from "@juliacomputing/dyad-kernel/node";
import { isComponentDefinition } from "@juliacomputing/dyad-ast";
import { Problem, problemMessage } from "@juliacomputing/dyad-common";

export interface RenderOptions {
  dir: string;
}

export async function render(modelname: string, options: RenderOptions) {
  const parts = modelname.split(".");
  if (parts.length < 2) {
    throw new Error(
      "Component name must include at least the library and component name, e.g., Electrical.Resistor"
    );
  }
  const library = parts[0];
  const modulePath = parts.slice(1, -1);
  const component = parts.at(-1);

  if (component === undefined) {
    throw new Error("Unable to extract component name");
  }

  const { workspace, nfs } = await initializeWorkspace(options.dir);

  const def = workspace.query(queryType(library, modulePath, component));
  await def.caseOf({
    Nothing: async () => {
      throw new Error(
        `Unable to locate component ${component} in module ${modulePath.join(
          "."
        )} in library ${library}`
      );
    },
    Just: async (v) => {
      if (isComponentDefinition(v)) {
        const inst = instantiateModel(
          v,
          {},
          null,
          workspace.query.bind(workspace)
        );
        const problems: Problem[] = [];
        await inst.ifAsyncResult(async (instance) => {
          const diagram = await generateDiagram(
            "",
            instance,
            workspace.query.bind(workspace)
          );
          console.log(diagram);
        }, problems);
        for (const problem of problems) {
          console.error(
            `Error while rendering ${v.name.value}: ${problemMessage(problem)}`
          );
        }
      } else {
        console.error(
          `Component ${component} is not a component definition, so it doesn't have a diagram to render`
        );
      }
    },
  });
  nfs.close();
}
