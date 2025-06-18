import {
  FileContents,
  isFileContents,
  isRawFile,
  RawFile,
  SourceKey,
  TextProblem,
} from "@juliacomputing/dyad-ast";
import { QueryHandler, Selector } from "../selector.js";
import { queryAllModules, queryModule } from "./modules.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { FileEntity } from "../entities/files.js";
import {
  assertUnreachable,
  Problem,
  Result,
} from "@juliacomputing/dyad-common";
import {
  instantiateAnalysis,
  instantiateModel,
  instantiateRecordConnector,
  instantiateRecordType,
  instantiateScalarConnector,
} from "../../instantiate/index.js";
import { resolveDefinition } from "../types/operations.js";
import { getFileNode } from "./nodes.js";

export function queryParsingProblems(): Selector<TextProblem[]> {
  return ({ query }) =>
    query(queryRawFiles()).reduce<TextProblem[]>(
      (p, r) => [...p, ...r.problems],
      []
    );
}

export function queryRawFiles(): Selector<RawFile[]> {
  return ({ query }) => {
    const ret: RawFile[] = [];
    const all = query(queryAllModules);
    const keys = [...all.keys()];
    for (const key of keys) {
      const mod = all.get(key);
      if (mod === undefined) {
        continue;
      }

      for (const file of mod.files) {
        if (isRawFile(file)) {
          ret.push(file);
        }
      }
    }
    return ret;
  };
}

export function queryFile(
  libraryName: string,
  key: SourceKey
): Selector<Maybe<FileContents>> {
  return ({ query }) => {
    const mod = query(queryModule(libraryName, key.mod));
    return mod.chain((m) => {
      for (const file of m.files) {
        if (file.source.file === key.file) {
          return Just(file);
        }
      }
      return Nothing;
    });
  };
}

/**
 * This returns a list of all problems associated with a given file.
 *
 * @param c `FileContents` node
 * @param workspace
 * @returns
 */
export const fileProblems = (c: FileEntity): Selector<Problem[]> => {
  return ({ query }) => {
    const file = query(getFileNode(c, isFileContents));
    const childProblems = file.map((c) => collectFileProblems(c, query));
    return childProblems.caseOf({
      errors: (e) => [...e],
      warnings: (v, w) => [...v, ...w],
      success: (v) => [...v],
    });
    // This old way of doing things masked the underlying problem
    // return file.mapOrDefault(
    //   (c) => collectFileProblems(c, query),
    //   [missingEntity(c, `No file entity found named ${c}`)]
    // );
  };
};

function collectFileProblems(c: FileContents, query: QueryHandler): Problem[] {
  if (c.kind === "file") {
    const models: Result<any>[] = [];
    for (const def of c.definitions) {
      switch (def.kind) {
        case "cdef": {
          models.push(instantiateModel(def, {}, null, query));
          break;
        }
        case "adef": {
          models.push(instantiateAnalysis(def, {}, query));
          break;
        }
        case "sclcon": {
          models.push(instantiateScalarConnector(def, null, def.span));
          break;
        }
        case "strcon": {
          models.push(instantiateRecordConnector(def, null, def.span, query));
          break;
        }
        case "struct": {
          models.push(instantiateRecordType(def, {}, null, def, query));
        }
        case "fun":
        case "scalar": {
          models.push(resolveDefinition(def, query, []));
          break;
        }
        case "enum": {
          console.warn("Error checking on enums is currently not supported");
          break;
        }
        default: {
          assertUnreachable(def);
        }
      }
    }
    const all = Result.all(models);
    return all.problems();
  } else {
    return c.problems;
  }
}
