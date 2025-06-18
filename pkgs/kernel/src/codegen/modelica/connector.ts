import { Problem } from "@juliacomputing/dyad-common";
import { StructConnectorInstance } from "../../instantiate/connector.js";
import {
  CompilerAssertionError,
  UnimplementedError,
} from "../../workspace/errors.js";
import { Output } from "./output.js";
import { ResolvedScalarType } from "../../workspace/types/index.js";
import { qualifiedName } from "@juliacomputing/dyad-ast";
import { extractUnits } from "../../workspace/utils.js";

export function emitModelicaConnector(
  c: StructConnectorInstance,
  output: Output
): Problem[] {
  const ret: Problem[] = [];

  output.startFile(c.name.value);

  const doc =
    c.doc_string === null
      ? ""
      : ` "${c.doc_string.value.split("\n").join(" ")}"`;
  output.writeLine(`connector ${c.name.value}${doc}`);
  for (const elem of c.elems) {
    let qual = "";
    const attrs: Record<string, any> = {};
    const units = extractUnits(elem.attributes);
    if (units !== "--") {
      attrs["unit"] = `u"${units}"`;
    }
    switch (elem.qualifier) {
      case "potential": {
        break;
      }
      case "flow": {
        qual = "flow ";
        break;
      }
      case "input": {
        qual = "input ";
        break;
      }
      case "output": {
        qual = "output ";
        break;
      }
      /* istanbul ignore next */
      default: {
        throw new UnimplementedError(
          "emitModelicaConnector",
          `Unimplemented qualifier ${elem.qualifier} in connector code generation`
        );
      }
    }
    const res = elem.type;
    if (res.resolves !== "scalar") {
      throw new CompilerAssertionError(
        "emitModelicaConnector",
        `Expected scalar type for connector variables in Modelica`
      );
    }
    const typename = scalarTypeName(res);
    const edoc =
      elem.doc_string === null
        ? ""
        : ` "${elem.doc_string.value.split("\n").join(" ")}"`;

    output.writeLine(`  ${qual}${typename} ${elem.name}${edoc};`);
  }

  output.writeLine(`end ${c.name.value};`);
  output.endFile(c.name.value);

  return ret;
}

/**
 * A resolved scalar type could be a built-in or a derived type.  This function implements
 * the logic to work through the contingencies and array at the _most specific_ type name.
 *
 * @param elem
 * @returns
 */
function scalarTypeName(elem: ResolvedScalarType): string {
  return elem.derived.mapOrDefault(
    (x) => x.name.value,
    qualifiedName(elem.base)
  );
}
