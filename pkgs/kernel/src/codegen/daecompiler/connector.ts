import { baseLibraryName, Problem } from "@juliacomputing/dyad-common";
import {
  StructConnectorInstance,
  ScalarConnectorInstance,
} from "../../instantiate/connector.js";
import { DAEHandler, ModuleName, definitionKey } from "./events.js";
import { generateDocString } from "./docs.js";
import {
  UnimplementedError,
  CompilerAssertionError,
} from "../../workspace/errors.js";
import { DyadLibrary } from "@juliacomputing/dyad-ast";
import { ResolvedType } from "../../workspace/types/index.js";
import { qualifiedName } from "@juliacomputing/dyad-ast";

function determineDAEType(t: ResolvedType): string {
  switch (t.resolves) {
    case "scalar":
      switch (qualifiedName(t.base)) {
        case "Real":
          return "Float64";
        case "Integer":
          return "Int64";
        case "Boolean":
          return "Bool";
        case "String":
          return "String";
        /* istanbul ignore next */
        default:
          throw new CompilerAssertionError(
            "determineDAEType",
            `Expected a builtin type, got ${qualifiedName(t.base)}`
          );
      }
    case "struct": {
      return t.def.name.value;
    }
    default:
      throw new UnimplementedError(
        "determineDAEType",
        `The function determineDAEType cannot (yet) handle ${t.resolves} types`
      );
  }
}

export async function emitRecordConnector(
  c: StructConnectorInstance,
  library: DyadLibrary,
  module: ModuleName,
  handler: DAEHandler
): Promise<Problem[]> {
  const isBase = library.name === baseLibraryName;
  const prefix = isBase ? `__${baseLibraryName}__` : "";

  const ret: Problem[] = [];
  const lines: string[] = [];

  lines.push(...generateDocString(c.doc_string));
  lines.push(`@kwdef struct ${prefix}${c.name.value}`);
  for (const elem of c.elems) {
    if (elem.qualifier === "path") {
      throw new UnimplementedError(
        "emitRecordConnector",
        `Generated DAECompiler code does not (yet) support path variables.`
      );
    }
    lines.push(
      `  ${elem.name}::${determineDAEType(elem.type)} = variable(:${elem.name})`
    );
  }
  lines.push(`end`);
  if (library.name !== baseLibraryName) {
    lines.push(`export ${prefix}${c.name.value}`);
  }

  if (isBase) {
    await handler.preamble(module, "definition", lines.join("\n"));
  } else {
    await handler.source(definitionKey(module, c.name.value), lines.join("\n"));
  }

  return ret;
}

export function emitScalarConnector(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  c: ScalarConnectorInstance,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  library: DyadLibrary,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  module: ModuleName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: DAEHandler
): Problem[] {
  // NB For now, this does nothing.  This is because DAECompiler doesn't have a concept of
  // a connector definition for a directional/scalar connector.  But we've discussed
  // adding one potentially in the future and if such a thing were to be added, this
  // is where it would be generated.
  return [];
}
