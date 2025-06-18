import { Lines } from "@juliacomputing/dyad-common";
import { codeFence, dyadCodeFenceLanguage, inlineCode } from "./primitives.js";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import { ScalarTypeDefinition } from "@juliacomputing/dyad-ast";
import { NormalizedRenderOptions } from "./options.js";

export function renderScalarType(
  options: NormalizedRenderOptions,
  def: ScalarTypeDefinition,
  flat: ScalarTypeDefinition
): string {
  const lines = new Lines("");
  lines.add(`# ${inlineCode(def.name.value)}`);
  if (def.doc_string !== null) {
    lines.add("");
    lines.add(def.doc_string.value);
  }
  lines.add("");
  lines.add("## Usage");
  lines.add("");
  lines.add(inlineCode(`${def.name.value}()`));
  lines.add("");
  lines.add("## Source");
  lines.add(codeFence(dyadCodeFenceLanguage, unparseDyad(def)));
  lines.add("");
  lines.add(
    options.html(`
<details>
<summary>Flattened Source</summary>
<pre>
${unparseDyad(flat)}
</pre>
</details>
`)
  );
  lines.add(
    options.html(`
<br>
`)
  );
  lines.add("");
  lines.add("## Related");
  lines.add("");
  lines.add("- Examples");
  lines.add("- Experiments");
  lines.add("- Analyses");
  lines.add("- Tests");
  return lines.toString();
}
