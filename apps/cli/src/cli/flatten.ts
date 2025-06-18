import {
  definitionEntity,
  flattenDefinitionEntity,
  stringifyProblem,
} from "@juliacomputing/dyad-kernel";
import { initializeWorkspace } from "@juliacomputing/dyad-kernel/node";
import { toProblems } from "@juliacomputing/dyad-common";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import { Definition } from "@juliacomputing/dyad-ast";

export interface FlattenOptions {
  dir: string;
  strip: boolean;
}

function stripMetadata(def: Definition): Definition {
  const ret = { ...def };
  ret.metadata = null;
  switch (ret.kind) {
    case "cdef": {
      for (const [dname, decl] of Object.entries(ret.declarations)) {
        const stripped = { ...decl };
        stripped.metadata = null;
        ret.declarations[dname] = stripped;
      }
    }
  }
  return ret;
}

export async function flatten(modelname: string, options: FlattenOptions) {
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

  const entry = definitionEntity(library, modulePath, component);

  const { workspace, nfs } = await initializeWorkspace(options.dir);

  const def = workspace.query(flattenDefinitionEntity(entry, new Set()));
  const text = def.map((d) =>
    options.strip ? unparseDyad(stripMetadata(d)) : unparseDyad(d)
  );
  const problems = toProblems(text);
  for (const problem of problems) {
    console.error("While flattening: ", stringifyProblem(problem));
  }
  if (text.hasValue()) {
    console.log(text.value);
  }
  nfs.close();
}
