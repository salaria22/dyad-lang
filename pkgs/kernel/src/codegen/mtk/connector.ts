import {
  assertUnreachable,
  Problem,
  baseLibraryName,
} from "@juliacomputing/dyad-common";
import {
  StructConnectorInstance,
  ScalarConnectorInstance,
} from "../../instantiate/connector.js";
import { MTKHandler, ModuleName, definitionKey } from "./events.js";
import { generateDocString } from "./docs.js";
import { Workspace } from "../../workspace/workspace.js";
import { DyadLibrary } from "@juliacomputing/dyad-ast";
import {
  extractGuess,
  extractUnits,
  QueryHandler,
} from "../../workspace/index.js";
import { MTKCodeGenerationOptions } from "./options.js";

export async function emitRecordConnector(
  c: StructConnectorInstance,
  query: QueryHandler,
  library: DyadLibrary,
  module: ModuleName,
  handler: MTKHandler,
  options: MTKCodeGenerationOptions
): Promise<Problem[]> {
  const isBase = library.name === baseLibraryName;
  const prefix = isBase ? `__${baseLibraryName}__` : "";

  const ret: Problem[] = [];
  const lines: string[] = [];

  lines.push(...generateDocString(c.doc_string));
  lines.push(`@connector function ${prefix}${c.name.value}(; name)`);
  lines.push(`  vars = @variables begin`);
  for (const elem of c.elems) {
    if (elem.qualifier === "path") {
      // Currently, common variables don't even appear in the connectors
      continue;
    }
    const attrs: Record<string, any> = {};
    const units = extractUnits(elem.attributes);
    const guess = extractGuess(elem.attributes);
    if (units !== "--" && options.includeUnits) {
      attrs["units"] = `u"${units}"`;
    }
    if (elem.doc_string !== null) {
      attrs["description"] = `"${elem.doc_string.value.split("\n").join(" ")}"`;
    }
    guess.ifJust((g) => (attrs["guess"] = `${g}`));
    switch (elem.qualifier) {
      case "potential": {
        break;
      }
      case "flow": {
        attrs["connect"] = "Flow";
        break;
      }
      case "input": {
        attrs["input"] = "true";
        break;
      }
      case "output": {
        attrs["output"] = "true";
        break;
      }
      case "stream": {
        attrs["connect"] = "Stream";
        break;
      }
      /* istanbul ignore next */
      default: {
        assertUnreachable(elem.qualifier);
      }
    }
    const attrStr = Object.entries(attrs)
      .map(([key, val]) => `${key} = ${val}`)
      .join(", ");
    lines.push(`    ${elem.name}(t), [${attrStr}]`);
  }
  lines.push(`  end`);

  lines.push(`  return ODESystem(Equation[], t, vars, []; name)`);
  lines.push(`end`);
  if (library.name !== baseLibraryName) {
    lines.push(`export ${prefix}${c.name.value}`);
  }

  if (isBase) {
    await handler.preamble(module, "definition", lines.join("\n"));
  } else {
    await handler.source(definitionKey(module, c.name.value), lines.join("\n"));
  }

  return ret;
}

export function emitScalarConnector(
  _c: ScalarConnectorInstance,
  _workspace: Workspace,
  _library: DyadLibrary,
  _module: ModuleName,
  _handler: MTKHandler
): Problem[] {
  // NB For now, this does nothing.  This is because MTK doesn't have a concept of
  // a connector definition for a directional/scalar connector.  But we've discussed
  // adding one potentially in the future and if such a thing were to be added, this
  // is where it would be generated.
  return [];
}
