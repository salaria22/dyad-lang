import { assertUnreachable, Lines, Problem } from "@juliacomputing/dyad-common";
import { StructTypeInstance } from "../../instantiate/struct.js";
import { generateDocString } from "./docs.js";
import { MTKHandler, ModuleName, typeKey } from "./events.js";
import { unparseMTKExpression } from "../equation.js";
import { normalizeBaseType } from "../../instantiate/variable.js";
import { hasExpression } from "@juliacomputing/dyad-ast";

export function emitStructLines(
  inst: StructTypeInstance,
  indent: string,
  name_prefix: string
) {
  const lines = new Lines(indent);
  lines.add(...generateDocString(inst.def.doc_string));

  const structName = `${name_prefix}${inst.def.name.value}`;
  // Define keyword mutable struct
  lines.add(`@kwdef mutable struct ${structName}`);

  for (const elem of inst.elems) {
    // TODO: Make sure this works for substructs
    const init = elem.init ? ` = ${unparseMTKExpression(elem.init)}` : "";
    switch (elem.type.kind) {
      case "scalar":
        lines.add(
          `    ${elem.name}::${normalizeBaseType(elem.type.type)}${init}`
        );
        break;
      case "fun":
        lines.add(`    ${elem.name}::Function${init}`);
        break;
      case "struct":
        lines.add(`    ${elem.name}::${elem.type.def.name.value}${init}`);
        break;
      default:
        assertUnreachable(elem.type);
    }
  }
  lines.add(`end`);

  lines.add(``);

  // Define the setproperty for this struct
  lines.add(
    `function Base.setproperty!(value::${structName}, name::Symbol, x)`
  );
  for (const elem of inst.elems) {
    if (elem.type.kind === "scalar") {
      const min = elem.type.mods["min"];
      const max = elem.type.mods["max"];
      if (min && hasExpression(min) && min.expr.type !== "ulit") {
        const tmin = unparseMTKExpression(min.expr);
        lines.add(`  if name == :${elem.name}`);
        lines.add(
          `    @assert x > ${tmin} "${elem.name} must be greater than ${tmin}"`
        );
        lines.add(`  end`);
      }
      if (max && hasExpression(max) && max.expr.type !== "ulit") {
        const tmax = unparseMTKExpression(max.expr);
        lines.add(`  if name == :${elem.name}`);
        lines.add(
          `    @assert x < ${tmax} "${elem.name} must be less than ${tmax}"`
        );
        lines.add(`  end`);
      }
    }
  }
  lines.add(`  Base.setfield!(value, name, x)`);
  lines.add(`end`);

  lines.add(``);

  // Define the show method for this struct
  lines.add(`function Base.show(io::IO, ::MIME"text/plain", x::${structName})`);
  lines.add(
    `  println(io, "[${structName}] \\n ${inst.elems
      .map((e) => `${e.name}=$(x.${e.name})`)
      .join(" \\n ")}")`
  );
  lines.add(`end`);

  lines.add(``);

  // Implement copy method
  lines.add(
    `Base.copy(x::${structName}) = ${structName}(${inst.elems
      .map((e) => `x.${e.name}`)
      .join(", ")})`
  );

  lines.add(``);

  // Implement broadcast
  lines.add(
    `Base.broadcasted(::Type{Pair}, model::ODESystem, pars::${structName}) = [`
  );
  for (const elem of inst.elems) {
    switch (elem.type.kind) {
      case "scalar":
      case "fun":
        lines.add(`  model.${elem.name} => pars.${elem.name},`);
        break;
      case "struct":
        lines.add(`  (model.${elem.name} .=> pars.${elem.name})...,`);
        break;
      default:
        assertUnreachable(elem.type);
    }
  }
  lines.add(`]`);

  lines.add("");

  lines.add(`export ${structName}\n`);
  return lines;
}
export async function emitStructType(
  inst: StructTypeInstance,
  module: ModuleName,
  handler: MTKHandler
): Promise<Problem[]> {
  const ret: Problem[] = [];
  const lines = emitStructLines(inst, "", "");

  await handler.source(typeKey(module, inst.def.name.value), lines.toString());

  return ret;
}
