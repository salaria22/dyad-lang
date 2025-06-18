import {
  DyadLibrary,
  findModule,
  isParsedFile,
  isRawFile,
} from "@juliacomputing/dyad-ast";
import { emitRecordConnector, emitScalarConnector } from "./connector.js";
import { Workspace } from "../../workspace/workspace.js";
import { emitComponent, generateComponentDiagram } from "./model.js";
import { AnalysisInstance, instantiateModel } from "../../instantiate/index.js";

import {
  instantiateScalarConnector,
  instantiateRecordConnector,
  StructConnectorInstance,
} from "../../instantiate/connector.js";
import {
  assertUnreachable,
  failedResult,
  Problem,
  Result,
} from "@juliacomputing/dyad-common";
import { mtkLog } from "./log.js";
import { MTKHandler } from "./events.js";
import { NoSuchModule } from "../errors.js";
import { instantiateAnalysis } from "../../instantiate/analysis.js";
import { emitAnalysis } from "./analysis.js";
import { emitImports } from "./imports.js";
import { emitBase } from "./base.js";
import { emitPreambles } from "./preamble.js";
import { MTKCodeGenerationOptions, normalizeMTKCGOptions } from "./options.js";
import {
  instantiateRecordType,
  StructTypeInstance,
} from "../../instantiate/struct.js";
import { emitStructType } from "./struct.js";
import {
  EnumTypeInstance,
  instantiateEnumType,
} from "../../instantiate/enum.js";
import { emitEnumType } from "./enum.js";

export async function generateMTKCode(
  /**
   * This is the rare exception where we pass in a `Workspace instance so that
   * we have access to the `runExclusively` method.
   */
  workspace: Workspace,
  library: DyadLibrary,
  module: string[],
  handler: MTKHandler,
  opts?: Partial<MTKCodeGenerationOptions>
): Promise<Array<Problem<unknown>>> {
  // This ensures that the tree does not change out from under use while doing
  // code generation.
  return workspace.runExclusively(async () => {
    const ret: Array<Problem<unknown>> = [];
    const mod = findModule(library, module);
    const options = normalizeMTKCGOptions(opts ?? {});
    if (mod === null) {
      ret.push(
        NoSuchModule(
          `${library.name}:.${module.join(".")}`,
          `Unable to find a module named '.${module.join(".")}' in library ${
            library.name
          }`
        )
      );
      return ret;
    }

    // FIX: should actually determine all modules present
    const modules = [module];
    await handler.modules([module]);

    for (const module of modules) {
      mtkLog("Generating code for module .%s", module.join("."));
      await handler.startModule(module);
      // Emit pre-ambles for everything
      await emitPreambles(module, handler, options);

      await emitImports(workspace, library, module, handler);

      mtkLog(
        "Parsed files: %j",
        mod.files.map((x) => x.source)
      );
      for (const file of mod.files) {
        if (isParsedFile(file)) {
          mtkLog("  Processing parsed file %j", file.source);
          for (const def of file.definitions) {
            switch (def.kind) {
              case "strcon": {
                mtkLog(
                  "    Processing definition of %s named %s",
                  def.kind,
                  def.name.value
                );
                await instantiateRecordConnector(
                  def,
                  null,
                  def.span,
                  workspace.query.bind(workspace)
                ).ifAsyncResult(async (instance: StructConnectorInstance) => {
                  const probs = await emitRecordConnector(
                    instance,
                    workspace.query.bind(workspace),
                    library,
                    module,
                    handler,
                    options
                  );
                  ret.push(...probs);
                }, ret);
                break;
              }
              case "sclcon": {
                mtkLog(
                  "    Processing definition of %s named %s",
                  def.kind,
                  def.name.value
                );

                instantiateScalarConnector(def, null, def.span).ifResult(
                  (instance) => {
                    emitScalarConnector(
                      instance,
                      workspace,
                      library,
                      module,
                      handler
                    );
                  },
                  ret
                );
                break;
              }
              case "cdef": {
                mtkLog(
                  "    Processing definition of %s named %s",
                  def.kind,
                  def.name.value
                );

                const minst = instantiateModel(
                  def,
                  {},
                  null,
                  workspace.query.bind(workspace)
                );
                // This should eventually be replaced with a call to chainAsync
                const diagramResult = await minst.caseOf({
                  errors: async (e): Promise<Result<string>> =>
                    failedResult(...e),
                  warnings: async (v, warnings): Promise<Result<string>> => {
                    return (
                      await generateComponentDiagram(
                        v,
                        workspace.query.bind(workspace)
                      )
                    ).add(...warnings);
                  },
                  success: async (v): Promise<Result<string>> =>
                    await generateComponentDiagram(
                      v,
                      workspace.query.bind(workspace)
                    ),
                });
                // NB - We don't use ifResult here a) because the closure is async
                // and b) because the `Result` contains an array of Problems so we
                // need to use a special `caseOf` handler rather than the more
                // typical `ifResult`.
                const pr = (
                  await minst.mapAsync(async (instance): Promise<Problem[]> => {
                    mtkLog(
                      "      Instantiation of %s successful",
                      def.name.value
                    );
                    const ret: Problem[] = [];
                    if (def.qualifier !== "partial") {
                      let diagram: string = "";
                      try {
                        diagramResult.ifResult((d) => {
                          diagram = d;
                        }, ret);
                      } catch (e) {
                        // Do nothing.
                      }
                      ret.push(
                        ...(await emitComponent(
                          instance,
                          workspace.query.bind(workspace),
                          module,
                          diagram,
                          handler,
                          options
                        ))
                      );
                    }
                    return [];
                  })
                ).add(...diagramResult.problems());
                pr.caseOf({
                  success: (v) => ret.push(...v),
                  warnings: (v, warnings) => ret.push(...v, ...warnings),
                  errors: (errors) => ret.push(...errors),
                });
                break;
              }
              case "adef":
                mtkLog(
                  "    Processing definition of %s named %s",
                  def.kind,
                  def.name.value
                );

                await instantiateAnalysis(
                  def,
                  {},
                  workspace.query.bind(workspace)
                ).ifAsyncResult(
                  (inst: AnalysisInstance) =>
                    emitAnalysis(inst, module, workspace, handler),
                  ret
                );
                break;
              case "struct":
                mtkLog(
                  "    Processing definition of %s named %s",
                  def.kind,
                  def.name.value
                );

                await instantiateRecordType(
                  def,
                  {},
                  null,
                  def,
                  workspace.query.bind(workspace)
                ).ifAsyncResult(async (inst: StructTypeInstance) => {
                  const probs = await emitStructType(inst, module, handler);
                  ret.push(...probs);
                }, ret);
                break;
              case "enum":
                await instantiateEnumType(
                  def,
                  workspace.query.bind(workspace)
                ).ifAsyncResult(async (inst: EnumTypeInstance) => {
                  const probs = await emitEnumType(inst, module, handler);
                  ret.push(...probs);
                }, ret);
                break;
              case "fun":
              case "scalar":
                break;
              /* istanbul ignore next */
              default:
                assertUnreachable(def);
            }
          }
        }
        if (isRawFile(file)) {
          mtkLog("Unable to parse %s", file.source);
          // Copy problems from raw file to return value
          file.problems.forEach((p) => ret.push(p));
        }
      }

      // Emit base definitions in this module
      const bprobs = await emitBase(
        workspace.query.bind(workspace),
        module,
        handler,
        options
      );
      ret.push(...bprobs);

      await handler.endModule(module);
    }
    await handler.close();
    return ret;
  });
}
