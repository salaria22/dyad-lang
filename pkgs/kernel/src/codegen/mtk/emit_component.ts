import { ComponentIR } from "./component_ir.js";
import "./templates/precompiled.js";

export function emitMTKComponent(ret: ComponentIR) {
  const lines: string[] = [];

  if (ret.comment) {
    lines.push(prependPrefix(ret.comment, "#"));
  }
}

function _buildComponentDocString(ret: ComponentIR): string {
  const doc_string: string[] = [
    `   ${ret.function_name}(${ret.positional_arguments.join(", ")}; name, ${Object.entries(
      ret.keyword_arguments
    )
      .map(([key, val]) => `${key} = ${val}`)
      .join(", ")})`,
  ].filter((x) => x !== "");

  if (ret.doc_string) {
    doc_string.push(ret.doc_string);
  }

  if (doc_string.length > 0) {
    return `@doc Markdown.doc"""
      ${doc_string.join("\n\n")}
      """`;
  }
  return "";
}

function prependPrefix(block: string, prefix: string): string {
  return block
    .split("\n")
    .map((x) => `${prefix}${x}`)
    .join("\n");
}
