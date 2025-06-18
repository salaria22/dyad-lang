import { DocString } from "@juliacomputing/dyad-ast";
import { VariableInstance } from "../../instantiate/variable.js";
import { unparseDAEExpression } from "../equation.js";
import { ConnectorInstance } from "../../instantiate/index.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { extractUnits } from "../../workspace/utils.js";

export function generateDocString(s: Nullable<DocString>): string[] {
  if (s === null || s.value === "") {
    return [];
  }
  return [`"""`, ...s.value.split("\n"), `"""`];
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

function rightpad(s: string, n: number): string {
  if (s.length >= n) {
    return s;
  }
  return s + " ".repeat(n - s.length);
}

export function variableDocString(
  variables: Array<[string, VariableInstance]>
): string {
  const rows: string[][] = [];
  const labels = ["Name", "Description", "Units"];
  const width: number[] = labels.map((l) => l.length);
  for (const [vname, v] of variables) {
    const row = [
      "\`" + vname + "\`",
      v.doc_string === null ? "" : v.doc_string.value,
      extractUnits(v.attributes),
    ];
    // Compute maximum column widths
    for (const [i, cell] of row.entries()) {
      if (cell.length > width[i]) {
        width[i] = cell.length;
      }
    }
    rows.push(row);
  }

  const lines: string[] = [];
  if (variables.length > 0) {
    lines.push("## Variables");
    lines.push("");
    lines.push(
      `| ${labels.map((s, i) => rightpad(s, width[i])).join(" | ")} |`
    ); // | Name   | Descri ...
    lines.push(`| ${labels.map((_, i) => "-".repeat(width[i])).join(" | ")} |`); // | ------ | ------ ...
    for (const row of rows) {
      lines.push(`| ${row.map((s, i) => rightpad(s, width[i])).join(" | ")} |`); // | Entry1 | Entry2 ...
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
      const name = "\`" + cname + "\`";
      const link = "\`" + con.def.name.value + "\`";
      const doc_string =
        con.doc_string === null ? "" : `${con.doc_string.value} `;
      lines.push(` * ${name} - ${doc_string}([${link}](@ref))`);
    }
  }
  return lines.join("\n");
}

export function parameterDocString(
  parameters: Array<[string, VariableInstance]>
): string {
  const rows: string[][] = [];
  const labels = ["Name", "Description", "Units", "Default value"];
  const width: number[] = labels.map((l) => l.length);
  for (const [pname, param] of parameters) {
    const row = [
      "\`" + pname + "\`",
      param.doc_string === null ? "" : param.doc_string.value,
      extractUnits(param.attributes),
      param.default.mapOrDefault(unparseDAEExpression, ""),
    ];
    // Compute maximum column widths
    for (const [i, cell] of row.entries()) {
      if (cell.length > width[i]) {
        width[i] = cell.length;
      }
    }
    rows.push(row);
  }

  const lines: string[] = [];
  if (parameters.length > 0) {
    lines.push("## Parameters");
    lines.push("");
    lines.push(
      `| ${labels.map((s, i) => rightpad(s, width[i])).join(" | ")} |`
    ); // | Name   | Descri ...
    lines.push(`| ${labels.map((_, i) => "-".repeat(width[i])).join(" | ")} |`); // | ------ | ------ ...
    for (const row of rows) {
      lines.push(`| ${row.map((s, i) => rightpad(s, width[i])).join(" | ")} |`); // | Entry1 | Entry2 ...
    }
  }
  return lines.join("\n");
}
