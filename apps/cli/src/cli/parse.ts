import { queryType } from "@juliacomputing/dyad-kernel";
import { initializeWorkspace } from "@juliacomputing/dyad-kernel/node";

export interface ExportOptions {
  dir: string;
}

export async function parse(modelname: string, options: ExportOptions) {
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
      console.log(JSON.stringify(v, null, 4));
    },
  });
  nfs.close();
}
