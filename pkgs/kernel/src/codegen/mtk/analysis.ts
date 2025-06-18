import {
  isBooleanType,
  isIntegerType,
  isRealType,
  isStringType,
  Workspace,
} from "../../workspace/index.js";
import { MTKHandler, ModuleName, definitionKey } from "./events.js";
import { unparseMTKExpression } from "../equation.js";
import {
  hasExpression,
  hasNested,
  qualifiedName,
  isCompRef,
} from "@juliacomputing/dyad-ast";
import { CompilerAssertionError } from "../../workspace/errors.js";
import { AnalysisInstance } from "../../instantiate/generic.js";
import { FullyQualifiedName } from "./fqn.js";

export async function emitAnalysis(
  analysis: AnalysisInstance,
  module: ModuleName,
  workspace: Workspace,
  handler: MTKHandler
) {
  if (analysis.partial) {
    return;
  }

  const query = workspace.query.bind(workspace);

  const dlines: string[] = [`using DyadInterface`, ``];

  dlines.push(...analysis.packages.map((p) => `using ${p}`));
  dlines.push(
    ...[
      `@kwdef mutable struct ${analysis.name}Spec <: Abstract${analysis.basename}Spec`,
      `  name::Symbol = :${analysis.name}`,
    ]
  );

  for (const [key, val] of Object.entries(analysis.parameters)) {
    switch (val.type.resolves) {
      case "scalar": {
        // Determine the fully qualified name of the base type
        const qn = qualifiedName(val.type.base);

        // Determine if there is an initializer for this field
        const def = val.default
          .map((x) => ` = ${unparseMTKExpression(x)}`)
          .orDefault("");

        // Add the doc string, if there is one.
        if (val.doc_string) {
          const lines = val.doc_string.value.split("\n");
          for (const line of lines) {
            dlines.push(`  # ${line}`);
          }
        }

        // Extract the element type from the type declaration
        let eltypename: string;
        if (isRealType(val.type)) {
            eltypename = "Float64";
        } else if (isIntegerType(val.type)) {
            eltypename = "Int64";
        } else if (isStringType(val.type)) {
            eltypename = "String";
        } else if (isBooleanType(val.type)) {
            eltypename = "Bool";
        } else {
            console.log(`Scalar parameter ${key} was of unexpected type ${qn}`);
            eltypename = "Any";
        }
        // We only know that the type is an array, if it has nonzero `dims`.
        // Otherwise, it is a true scalar, i.e. a single value.
        if (val.dims.length < 1) {
          dlines.push(`  var"${key}"::${eltypename}${def}`);
        } else { // this is an array, i.e. a vector, matrix, etc.
          dlines.push(`  var"${key}"::Array{${eltypename}, ${val.dims.length}}${def}`);
        }
        
        break;
      }
      default: {
        // What happened here?!?
        console.warn(`Unhandled parameter type ${val.type.resolves}`);
        break;
      }
    }
  }

  for (const [key, val] of Object.entries(analysis.components)) {
    const def = workspace.query(val.def);
    // Add the doc string, if there is one.
    if (val.doc_string) {
      const lines = val.doc_string.value.split("\n");
      for (const line of lines) {
        dlines.push(`  # ${line}`);
      }
    }
    dlines.push(
      `  var"${key}"::Union{Nothing, ODESystem} = ${FullyQualifiedName(query, def)}(; name=:${def.name.value})`
    );
  }

  dlines.push(`end`);

  dlines.push("");

  dlines.push(`function DyadInterface.run_analysis(spec::${analysis.name}Spec)`);
  for (const [key, val] of Object.entries(analysis.components)) {
    const mods = Object.entries(val.mods).map(([key, val]) => {
      if (hasNested(val)) {
        throw new CompilerAssertionError(
          "emitAnalysis",
          "Nested modifications not yet supported"
        );
      }
      if (!hasExpression(val)) {
        throw new CompilerAssertionError(
          "emitAnalysis",
          "Got unexpected null expression in modification"
        );
      }
      const exprStr = unparseMTKExpression(val.expr);
      if (isCompRef(val.expr)) {
        return `var"${key}"=spec.var"${exprStr}"`;
      } else {
        return `var"${key}"=${exprStr}`;
      }
    });
    dlines.push(
      `  spec.${key} = DyadInterface.update_model(spec.${key}, (; ${mods.join(
        ", "
      )}))`
    );
  }

  const kwargs: string[] = [];
  kwargs.push(`name=:${analysis.basename}`);
  for (const [key, val] of Object.entries(analysis.parameters)) {
    if (val.origin !== analysis.self) {
      kwargs.push(`${key}=spec.${key}`);
    }
  }
  for (const [key, _] of Object.entries(analysis.components)) {
    kwargs.push(`${key}=spec.${key}`);
  }
  dlines.push(`  base_spec = ${analysis.basename}Spec(;`);
  dlines.push(`    ${kwargs.join(", ")}`);
  dlines.push(`  )`);
  dlines.push(`  run_analysis(base_spec)`);
  dlines.push(`end`);

  dlines.push("");

  dlines.push(
    `${analysis.name}(;kwargs...) = run_analysis(${analysis.name}Spec(;kwargs...))`,
    `export ${analysis.name}, ${analysis.name}Spec`
  );

  dlines.push(`export ${analysis.name}Spec, ${analysis.name}`);

  await handler.source(definitionKey(module, analysis.name), dlines.join("\n"));
}
