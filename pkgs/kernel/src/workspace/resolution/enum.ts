import { EnumTypeDefinition } from "@juliacomputing/dyad-ast";
import { enumType, EnumType } from "../newtypes/enum.js";
import { Result } from "@juliacomputing/dyad-common";
import { resolveStructType } from "./struct.js";
import { StructType } from "../newtypes/index.js";
import { combineResultMap } from "../../result.js";
import { Selector } from "../selector.js";

/**
 * Resolve the type of an `enum` definition
 *
 * @param node
 * @returns
 */
export function resolveEnumType(
  node: EnumTypeDefinition
): Selector<Result<EnumType>> {
  return ({ query }) => {
    const cases: Map<string, Result<StructType>> = new Map();
    for (const [cn, c] of Object.entries(node.cases)) {
      cases.set(cn, query(resolveStructType(c, node)));
    }
    const foo = combineResultMap(cases).map((cs) => {
      const et = enumType();
      for (const [cn, c] of cs) {
        et.options.set(cn, c);
      }
      return et;
    });
    return foo;
  };
}
