import { Lines, Problem } from "@juliacomputing/dyad-common";
import { MTKHandler, typeKey } from "../mtk/events.js";
import { ModuleName } from "./events.js";
import { EnumTypeInstance } from "../../instantiate/enum.js";
import { emitStructLines } from "./struct.js";

export function buildEnumStructName(enumName: string, caseid: string) {
  return `${enumName}__${caseid}`;
}
export async function emitEnumType(
  inst: EnumTypeInstance,
  module: ModuleName,
  handler: MTKHandler
): Promise<Problem[]> {
  const lines = new Lines("");
  for (const str of Object.values(inst.elements)) {
    const slines = emitStructLines(
      str,
      "",
      buildEnumStructName(inst.def.name.value, "")
    );
    lines.add(slines.toString());
  }

  await handler.source(typeKey(module, inst.def.name.value), lines.toString());

  return [];
}
