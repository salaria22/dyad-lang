import { FunctionTypeDefinition } from "@juliacomputing/dyad-ast";
import { FunctionType, functionType } from "../newtypes/functions.js";
import { Selector } from "../selector.js";
import { Result } from "@juliacomputing/dyad-common";
import { isVariableInstanceType } from "../newtypes/index.js";
import { resolveQualifiedType } from "./qualified.js";

/**
 * Constructs a type representation for a given function definition.
 *
 * @param node
 * @returns
 */
export function resolveFunctionType(
  node: FunctionTypeDefinition
): Selector<Result<FunctionType>> {
  return ({ query }) => {
    /** First process positional arguments into types */
    const pos = Result.all(
      node.positional.map((p) =>
        query(
          resolveQualifiedType(
            p,
            node,
            isVariableInstanceType,
            "a variable type"
          )
        )
      )
    );

    /** Next, do keyword arguments into types */
    const kw = Result.combine(
      Object.fromEntries(
        Object.entries(node.keyword).map(([k, v]) => [
          k,
          query(
            resolveQualifiedType(
              v,
              node,
              isVariableInstanceType,
              "a variable type"
            )
          ),
        ])
      )
    );

    /** Finally, process return types into types */
    const returns = Result.all(
      node.returns.map((p) =>
        query(
          resolveQualifiedType(
            p,
            node,
            isVariableInstanceType,
            "a variable type"
          )
        )
      )
    );

    /** Combine each of these into a `FunctionType` instance */
    return Result.combine({ pos, kw, returns }).map(({ pos, kw, returns }) => {
      const ret = functionType();
      ret.positional = pos;
      for (const [k, v] of Object.entries(kw)) {
        ret.keyword.set(k, v);
      }
      ret.returns = returns;
      return ret;
    });
  };
}
