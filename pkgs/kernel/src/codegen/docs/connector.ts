import { Lines } from "@juliacomputing/dyad-common";
import { codeFence, dyadCodeFenceLanguage, inlineCode } from "./primitives.js";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import {
  ScalarConnectorDefinition,
  StructConnectorDefinition,
} from "@juliacomputing/dyad-ast";
import { NormalizedRenderOptions } from "./options.js";
import { ConnectorInstance } from "../../instantiate/connector.js";
import { renderIcon } from "./icon.js";

export function renderStructureConnector(
  options: NormalizedRenderOptions,
  instance: ConnectorInstance,
  cdef: StructConnectorDefinition,
  icon: string
): string {
  const lines = new Lines("");
  renderIcon(lines, options, icon, instance.def.name.value);
  lines.add(`# ${inlineCode(instance.def.name.value)}`);
  if (instance.doc_string !== null) {
    lines.add("");
    lines.add(instance.doc_string.value);
  }
  lines.add("");
  lines.add("## Usage");
  lines.add("");
  lines.add(inlineCode(`${instance.def.name.value}()`));
  lines.add("");
  lines.add("## Source");
  lines.add(codeFence(dyadCodeFenceLanguage, unparseDyad(instance.def)));
  lines.add("");
  lines.add("## Related");
  lines.add("");
  lines.add("- Examples");
  lines.add("- Experiments");
  lines.add("- Analyses");
  lines.add("- Tests");
  return lines.toString();
}

export function renderScalarConnector(
  options: NormalizedRenderOptions,
  instance: ConnectorInstance,
  cdef: ScalarConnectorDefinition,
  icon: string
): string {
  const lines = new Lines("");
  renderIcon(lines, options, icon, instance.def.name.value);
  lines.add(`# ${inlineCode(instance.def.name.value)}`);
  if (instance.doc_string !== null) {
    lines.add("");
    lines.add(instance.doc_string.value);
  }
  lines.add("");
  lines.add("## Usage");
  lines.add("");
  lines.add(inlineCode(`${instance.def.name.value}()`));
  lines.add("");
  lines.add("## Source");
  lines.add(codeFence(dyadCodeFenceLanguage, unparseDyad(instance.def)));
  lines.add("");
  lines.add("## Related");
  lines.add("");
  lines.add("- Examples");
  lines.add("- Experiments");
  lines.add("- Analyses");
  lines.add("- Tests");
  return lines.toString();
}
