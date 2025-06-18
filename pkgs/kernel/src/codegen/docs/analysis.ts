import { Lines } from "@juliacomputing/dyad-common";
import { codeFence, dyadCodeFenceLanguage, inlineCode } from "./primitives.js";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import { NormalizedRenderOptions } from "./options.js";
import { AnalysisDefinition } from "@juliacomputing/dyad-ast";
import { AnalysisInstance } from "../../instantiate/generic.js";

export function renderAnalysis(
  options: NormalizedRenderOptions,
  instance: AnalysisInstance,
  def: AnalysisDefinition
): string {
  const lines = new Lines("");
  lines.add(`# ${inlineCode(def.name.value)}`);
  if (def.doc_string !== null) {
    lines.add("");
    lines.add(def.doc_string.value);
  }
  lines.add("");
  lines.add(
    `This component extends from [${inlineCode(def.extends.name.map((x) => x.value).join("."))}](#)`
  );
  lines.add("");
  lines.add("## Usage");
  lines.add("");
  // TODO: Have a way to visualize the arguments
  lines.add(inlineCode(`${def.name.value}(...)`));
  lines.add("");
  lines.add("## Source");
  lines.add(codeFence(dyadCodeFenceLanguage, unparseDyad(def)));
  lines.add("");
  //   lines.add(
  //     options.html(`
  // <details>
  // <summary>Flattened Source</summary>
  // <pre>
  // ${unparseDyad(flat)}
  // </pre>
  // </details>
  // `)
  //   );
  //   lines.add(
  //     options.html(`
  // <br>
  // `)
  //   );
  lines.add("");
  lines.add("## Related");
  lines.add("");
  lines.add("- Examples");
  return lines.toString();
}
