import { assertUnreachable, Problem } from "@juliacomputing/dyad-common";
import { StructTypeInstance } from "../../instantiate/struct.js";
import { generateDocString } from "./docs.js";
import { DAEHandler, ModuleName, typeKey } from "./events.js";
import { unparseDAEExpression } from "../equation.js";
import { normalizeBaseType } from "../../instantiate/variable.js";
import { hasExpression } from "@juliacomputing/dyad-ast";

export async function emitStructType(
  inst: StructTypeInstance,
  module: ModuleName,
  handler: DAEHandler
): Promise<Problem[]> {
  const lines: string[] = [];
  const ret: Problem[] = [];

  lines.push(...generateDocString(inst.def.doc_string));

  // Define keyword mutable struct
  lines.push(`@kwdef mutable struct ${inst.def.name.value}`);
  for (const elem of inst.elems) {
    // TODO: Make sure this works for substructs
    const init = elem.init ? ` = ${unparseDAEExpression(elem.init)}` : "";
    switch (elem.type.kind) {
      case "scalar":
        lines.push(
          `    ${elem.name}::${normalizeBaseType(elem.type.type)}${init}`
        );
        break;
      case "fun":
        lines.push(`    ${elem.name}::Function${init}`);
        break;
      case "struct":
        lines.push(`    ${elem.name}::${elem.type.def.name.value}${init}`);
        break;
      default:
        assertUnreachable(elem.type);
    }
  }
  lines.push(`end`);

  lines.push(``);

  // Define the setproperty for this struct
  lines.push(
    `function Base.setproperty!(value::${inst.def.name.value}, name::Symbol, x)`
  );
  for (const elem of inst.elems) {
    if (elem.type.kind === "scalar") {
      const min = elem.type.mods["min"];
      const max = elem.type.mods["max"];
      if (min && hasExpression(min) && min.expr.type !== "ulit") {
        const tmin = unparseDAEExpression(min.expr);
        lines.push(`  if name == :${elem.name}`);
        lines.push(
          `    @assert x > ${tmin} "${elem.name} must be greater than ${tmin}"`
        );
        lines.push(`  end`);
      }
      if (max && hasExpression(max) && max.expr.type !== "ulit") {
        const tmax = unparseDAEExpression(max.expr);
        lines.push(`  if name == :${elem.name}`);
        lines.push(
          `    @assert x < ${tmax} "${elem.name} must be less than ${tmax}"`
        );
        lines.push(`  end`);
      }
    }
  }
  lines.push(`  Base.setfield!(value, name, x)`);
  lines.push(`end`);

  lines.push(``);

  // Define the show method for this struct
  lines.push(
    `function Base.show(io::IO, ::MIME"text/plain", x::${inst.def.name.value})`
  );
  lines.push(
    `  println(io, "[${inst.def.name.value}] \\n ${inst.elems
      .map((e) => `${e.name}=$(x.${e.name})`)
      .join(" \\n ")}")`
  );
  lines.push(`end`);

  lines.push(``);

  // Implement copy method
  lines.push(
    `Base.copy(x::${inst.def.name.value}) = ${inst.def.name.value}(${inst.elems
      .map((e) => `x.${e.name}`)
      .join(", ")})`
  );

  lines.push(``);

  // Implement broadcast
  lines.push(
    `Base.broadcasted(::Type{Pair}, model::ODESystem, pars::${inst.def.name.value}) = [`
  );
  for (const elem of inst.elems) {
    switch (elem.type.kind) {
      case "scalar":
      case "fun":
        lines.push(`  model.${elem.name} => pars.${elem.name},`);
        break;
      case "struct":
        lines.push(`  (model.${elem.name} .=> pars.${elem.name})...,`);
        break;
      default:
        assertUnreachable(elem.type);
    }
  }
  lines.push(`]`);

  lines.push("");

  lines.push(`export ${inst.def.name.value}\n`);

  await handler.source(typeKey(module, inst.def.name.value), lines.join("\n"));

  return ret;
}
