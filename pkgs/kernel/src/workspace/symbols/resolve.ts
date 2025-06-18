import {
  ComponentDefinition,
  Definition,
  isComponentDefinition,
} from "@juliacomputing/dyad-ast";
import { Instance } from "../../instantiate/instance.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { CompilerAssertionError } from "../errors.js";
import { instantiateModel } from "../../instantiate/model.js";
import { globalVariables } from "./globals.js";
import {
  failedResult,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { Selector } from "../selector.js";

/**
 * Given a variable name, in a given context, determine the type
 * for that variable.
 *
 * @param name
 * @param context
 * @param query
 * @returns
 */
export function resolveVariableType(
  name: string,
  context: Definition
): Selector<Result<Instance>> {
  return ({ query }) => {
    /**
     * First, if the context is a definition, check to see if there are any
     * symbols in it that match this symbol.
     */
    const globals = Maybe.fromNullable(
      globalVariables.find((x) => x.name === name)
    );
    const result = (
      isComponentDefinition(context)
        ? query(searchComponentDefinition(name, context))
        : Nothing
    ).alt(globals);

    if (result.isJust()) {
      return successfulResult(result.unsafeCoerce());
    }
    return failedResult(missingDefinition(name));
  };
}

function searchComponentDefinition(
  name: string,
  def: ComponentDefinition
): Selector<Maybe<Instance>> {
  return ({ query }) => {
    return instantiateModel(def, {}, null, query)
      .mapOrDefault(Just, Nothing)
      .chain((model): Maybe<Instance> => {
        const con = model.connectors[name];
        if (con !== undefined) {
          return Just(con);
        }
        const comp = model.components[name];
        if (comp !== undefined) {
          return comp().mapOrDefault(Just, Nothing);
        }
        const param = model.parameters[name];
        if (param !== undefined) {
          return Just(param);
        }
        const v = model.variables[name];
        if (v !== undefined) {
          return Just(v);
        }
        return Nothing;
      });
  };
}

function missingDefinition(name: string) {
  return new CompilerAssertionError(
    name,
    `Unable to resolve symbol ${name} because the context node doesn't appear inside of a component or analysis definition`
  );
}
