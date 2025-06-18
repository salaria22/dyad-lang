import {
  Lines,
  partialResult,
  PartialResult,
  Problem,
  SuccessfulResult,
} from "@juliacomputing/dyad-common";
import { codeFence, dyadCodeFenceLanguage, inlineCode } from "./primitives.js";
import { ModelInstance } from "../../instantiate/model.js";
import { unparseExpression, unparseDyad } from "@juliacomputing/dyad-parser";
import {
  connectorDocString,
  parameterDocString,
  variableDocString,
} from "../mtk/docs.js";
import { ComponentDefinition } from "@juliacomputing/dyad-ast";
import { NormalizedRenderOptions } from "./options.js";
import { renderIcon } from "./icon.js";
import { QueryHandler } from "../../workspace/selector.js";
import { resolveType } from "../../workspace/index.js";

export interface ComponentSlots {
  pre_source?: string;
  pre_related?: string;
}

export function renderComponentMarkdown(
  options: NormalizedRenderOptions,
  instance: ModelInstance,
  def: ComponentDefinition,
  flattened: ComponentDefinition,
  tests: string[],
  slots: ComponentSlots,
  query: QueryHandler,
  icon: string,
  diagram?: string
): SuccessfulResult<string> | PartialResult<string> {
  const lines = new Lines("");
  const problems: Problem[] = [];
  renderIcon(lines, options, icon, def.name.value);
  lines.add(`# ${inlineCode(def.name.value)}`);
  if (instance.doc_string !== null) {
    lines.add("");
    lines.add(instance.doc_string.value);
  }
  if (def.extends.length > 0) {
    lines.add("");
    for (const e of def.extends) {
      const rt = query(resolveType(e.name, def, []));
      rt.ifResult((t) => {
        const href = options.generateHref(query, t);
        const label = inlineCode(e.name.map((n) => n.value).join("."));
        lines.add(
          href.caseOf({
            Nothing: () => label,
            Just: (url) => `[${label}](${url})`,
          })
        );
      }, problems);
    }
  }
  lines.add("");
  lines.add("## Usage");
  lines.add("");
  lines.add(inlineCode(`${def.name.value}(${parameterList(instance)})`));
  lines.add("");
  lines.add(
    parameterDocString(
      Object.entries(instance.structural),
      Object.entries(instance.parameters).filter((x) => !x[1].final)
    )
  );
  lines.add("");
  lines.add(connectorDocString(Object.entries(instance.connectors)));
  lines.add("");
  lines.add(variableDocString(Object.entries(instance.variables)));

  if (slots.pre_source) {
    lines.add("");
    lines.add(slots.pre_source);
  }
  lines.add("");

  lines.add("## Source");
  lines.add(codeFence(dyadCodeFenceLanguage, unparseDyad(def)));
  lines.add("");
  lines.add(
    options.html(`
<details>
<summary>Flattened Source</summary>
`)
);
lines.add(codeFence(dyadCodeFenceLanguage, unparseDyad(flattened)));
lines.add(options.html(`</details>`));
  lines.add(
    options.html(`
<br></br>
`));
  if (diagram !== undefined && Object.entries(instance.components).length > 0) {
    lines.add("");
    lines.add("## Diagram");
    lines.add(
      options.html(`
      <div style="">
      ${diagram}
      </div>
    `)
    );
  }
  if (slots.pre_related) {
    lines.add("");
    lines.add(slots.pre_related);
  }
  lines.add("");
  lines.add("## Related");
  lines.add("");
  lines.add("- Examples");
  lines.add("- Experiments");
  lines.add("- Analyses");
  if (tests.length > 0) {
    lines.add("- Tests");
    for (const t of tests) {
      lines.add(`  - [${inlineCode(t)}](#)`);
    }
  }
  return partialResult(lines.toString(), ...problems);
}

function parameterList(instance: ModelInstance): string {
  return Object.entries(instance.parameters)
    .map(([k, v]) =>
      v.default.mapOrDefault((e) => `${k}=${unparseExpression(e)}`, `${k}`)
    )
    .join(", ");
}
