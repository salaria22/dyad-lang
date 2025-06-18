import { DAEHandler, ModuleName } from "./events.js";
import { DAECodeGenerationOptions } from "./options.js";
import { warning } from "../warning.js";
import { baseLibraryName } from "@juliacomputing/dyad-common";

export async function emitPreambles(
  module: ModuleName,
  handler: DAEHandler,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: DAECodeGenerationOptions
) {
  await handler.preamble(
    module,
    "definition",
    `${warning}
using DAECompiler
using DAECompiler.Intrinsics
using OrdinaryDiffEq
using RuntimeGeneratedFunctions
RuntimeGeneratedFunctions.init(@__MODULE__)

struct ${baseLibraryName}System{T}
    toplevel::T
end
function (sys::${baseLibraryName}System{T})(; ) where T
    sys.toplevel()
    return nothing
end
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
using DAECompiler`
  );
  await handler.preamble(
    module,
    "test",
    `${warning}
using DAECompiler
using DAECompiler.Intrinsics
using OrdinaryDiffEq
using RuntimeGeneratedFunctions
RuntimeGeneratedFunctions.init(@__MODULE__)

`
  );
}
