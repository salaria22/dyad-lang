import { MTKHandler, ModuleName } from "./events.js";
import { MTKCodeGenerationOptions } from "./options.js";
import { warning } from "../warning.js";

export async function emitPreambles(
  module: ModuleName,
  handler: MTKHandler,
  options: MTKCodeGenerationOptions
) {
  const usingTime = options.includeUnits
    ? `using ModelingToolkit: t
using DynamicQuantities`
    : `using ModelingToolkit: t_nounits as t`;
  await handler.preamble(
    module,
    "definition",
    `${warning}
using ModelingToolkit
import Markdown
${usingTime}
using OrdinaryDiffEqDefault
using RuntimeGeneratedFunctions
RuntimeGeneratedFunctions.init(@__MODULE__)

D = Differential(t)
`
  );

  await handler.preamble(module, "experiment", warning);
  await handler.preamble(
    module,
    "precompilation",
    `${warning}
using PrecompileTools: @setup_workload, @compile_workload`
  );
  await handler.preamble(
    module,
    "type",
    `${warning}
using ModelingToolkit`
  );
  await handler.preamble(
    module,
    "test",
    `${warning}
using ModelingToolkit
import Markdown
using OrdinaryDiffEqDefault
using RuntimeGeneratedFunctions
RuntimeGeneratedFunctions.init(@__MODULE__)

`
  );
}
