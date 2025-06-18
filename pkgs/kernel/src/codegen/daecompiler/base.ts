import { isParsedFile } from "@juliacomputing/dyad-ast";
import {
  QueryHandler,
  queryLibrary,
  queryModule,
} from "../../workspace/index.js";
import { instantiateRecordConnector } from "../../instantiate/connector.js";
import { emitRecordConnector } from "./connector.js";
import { baseLibraryName, Problem } from "@juliacomputing/dyad-common";
import { DAEHandler } from "./events.js";

export async function emitBase(
  query: QueryHandler,
  module: string[],
  handler: DAEHandler
): Promise<Problem[]> {
  const baselib = query(queryLibrary(baseLibraryName)).extractNullable();
  const basemod = query(queryModule(baseLibraryName, []));
  return basemod.caseOf({
    Nothing: () => [],
    Just: (base) => {
      const problems: Problem[] = [];
      if (baselib !== null) {
        for (const file of base.files) {
          if (isParsedFile(file)) {
            for (const def of file.definitions) {
              switch (def.kind) {
                case "strcon": {
                  instantiateRecordConnector(
                    def,
                    null,
                    def.span,
                    query
                  ).ifResult(
                    (instance) =>
                      emitRecordConnector(instance, baselib, module, handler),
                    problems
                  );
                  break;
                }
              }
            }
          }
        }
      }
      return problems;
    },
  });
}
