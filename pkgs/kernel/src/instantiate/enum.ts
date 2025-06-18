import { EnumTypeDefinition } from "@juliacomputing/dyad-ast";
import { QueryHandler } from "../workspace/selector.js";
import { objectMap, Result } from "@juliacomputing/dyad-common";
import { instantiateRecordType, StructTypeInstance } from "./struct.js";

export interface EnumTypeInstance {
  kind: EnumTypeDefinition["kind"];
  def: EnumTypeDefinition;
  elements: Record<string, StructTypeInstance>;
}

export function instantiateEnumType(
  edef: EnumTypeDefinition,
  query: QueryHandler
): Result<EnumTypeInstance> {
  const cases = objectMap(edef.cases, (x) =>
    instantiateRecordType(x, {}, null, edef, query)
  );
  return Result.combine(cases).map((elements) => {
    const ret: EnumTypeInstance = {
      kind: "enum",
      def: edef,
      elements,
    };
    return ret;
  });
}
