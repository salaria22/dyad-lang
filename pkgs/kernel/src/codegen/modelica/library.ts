import {
  DyadLibrary,
  findModule,
  isParsedFile,
  isRawFile,
} from "@juliacomputing/dyad-ast";
import { QueryHandler, resolveType } from "../../workspace/index.js";
import { Output } from "./output.js";
import { Problem, assertUnreachable } from "@juliacomputing/dyad-common";
import {
  instantiateRecordConnector,
  instantiateModel,
} from "../../instantiate/index.js";
import { modLog } from "./log.js";
import { emitModelicaConnector } from "./connector.js";
import { emitModelicaModel } from "./model.js";
import { emitModelicaType } from "./scalar.js";
import { NoSuchModule } from "../errors.js";

export function generateModelicaCode(
  query: QueryHandler,
  library: DyadLibrary,
  module: string[],
  output: Output
): Array<Problem<unknown>> {
  const ret: Array<Problem<unknown>> = [];

  const mod = findModule(library, module);
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

  for (const file of mod.files) {
    if (isParsedFile(file)) {
      for (const def of file.definitions) {
        switch (def.kind) {
          case "strcon": {
            instantiateRecordConnector(def, null, def.span, query).ifResult(
              (instance) => {
                emitModelicaConnector(instance, output);
              },
              ret
            );
            break;
          }
          case "sclcon": {
            break;
          }
          case "cdef": {
            instantiateModel(def, {}, null, query).ifResult((i) => {
              if (def.qualifier !== "partial") {
                emitModelicaModel(i, query, output);
              }
            }, ret);
            break;
          }
          case "fun":
            // Nothing to do here
            break;
          case "adef":
            break;
          case "enum":
            break;
          case "struct":
            break;
          case "scalar":
            const t = query(resolveType([def.name], def, []));
            emitModelicaType(def.name.value, t, output, def, def.name.span);
            break;
          /* istanbul ignore next */
          default:
            assertUnreachable(def);
        }
      }
    }
    if (isRawFile(file)) {
      modLog("Unable to parse %s", file.source);
      // Copy problems from raw file to return value
      file.problems.forEach((p) => ret.push(p));
    }
  }
  return ret;
}
