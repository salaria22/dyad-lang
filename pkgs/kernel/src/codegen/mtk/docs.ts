import { DocString } from "@juliacomputing/dyad-ast";
import { VariableInstance } from "../../instantiate/variable.js";
import { unparseMTKExpression } from "../equation.js";
import { ConnectorInstance } from "../../instantiate/index.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { extractUnits } from "../../workspace/utils.js";

export function generateDocString(s: Nullable<DocString>): string[] {
  if (s === null || s.value === "") {
    return [];
  }
  return [`@doc Markdown.doc"""`, ...s.value.split("\n"), `"""`];
}

export function generateDocStringAsComment(
  s: Nullable<DocString>,
  prefix: string
): string[] {
  if (s === null || s.value === "") {
    return [];
  }
  return s.value.split("\n").map((l) => `${prefix}# ${l}`);
}

export function variableDocString(
  variables: Array<[string, VariableInstance]>
): string {
  const lines: string[] = [];

  if (variables.length > 0) {
    lines.push("## Variables");
    lines.push("");
    lines.push(
      "| Name         | Description                         | Units  | "
    );
    lines.push(
      "| ------------ | ----------------------------------- | ------ | "
    );
    for (const [vname, v] of variables) {
      lines.push(
        `| \`${vname}\`         | ${
          v.doc_string === null ? "" : v.doc_string.value
        }                         | ${extractUnits(v.attributes)}  | `
      );
    }
  }
  return lines.join("\n");
}

export function connectorDocString(
  connectors: Array<[string, ConnectorInstance]>
): string {
  const lines: string[] = [];
  if (connectors.length > 0) {
    lines.push("## Connectors");
    lines.push("");
    for (const [cname, con] of connectors) {
      lines.push(
        ` * \`${cname}\` - ${
          con.doc_string === null ? "" : `${con.doc_string.value} `
        }([\`${con.def.name.value}\`](@ref))`
      );
    }
  }
  return lines.join("\n");
}

export function parameterDocString(
  structural: Array<[string, VariableInstance]>,
  parameters: Array<[string, VariableInstance]>
): string {
  const lines: string[] = [];

  const all = [...structural, ...parameters];
  if (all.length > 0) {
    lines.push("## Parameters: ");
    lines.push("");
    lines.push(
      "| Name         | Description                         | Units  |   Default value |"
    );
    lines.push(
      "| ------------ | ----------------------------------- | ------ | --------------- |"
    );
    for (const [pname, param] of all) {
      lines.push(
        `| \`${pname}\`         | ${
          param.doc_string === null ? "" : param.doc_string.value
        }                         | ${extractUnits(
          param.attributes
        )}  |   ${param.default.mapOrDefault(unparseMTKExpression, "")} |`
      );
    }
  }
  const ret = lines.join("\n");
  return ret;
}
