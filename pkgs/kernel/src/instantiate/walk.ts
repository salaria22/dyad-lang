import {
  compRef,
  CompRef,
  expressionSpan,
  FileLevelNode,
  ProblemSpan,
} from "@juliacomputing/dyad-ast";
import { Instance } from "./instance.js";
import {
  assertUnreachable,
  failedResult,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { CompilerAssertionError } from "../workspace/errors.js";
import { unknownElement } from "./errors.js";
import { problemSpan } from "../workspace/utils.js";
import { QueryHandler } from "../workspace/index.js";
import { instantiateModel } from "./model.js";

export function walkInstance(
  inst: Instance,
  context: FileLevelNode,
  ref: CompRef,
  query: QueryHandler
): Result<Instance> {
  if (ref.elems.length === 0) {
    throw new CompilerAssertionError(
      `walkInstance`,
      "Passed empty component reference"
    );
  }
  const head = ref.elems[0];
  const rest = ref.elems.slice(1);
  const name = head.name;
  const span = problemSpan(context, expressionSpan(ref));

  return extractNamedInstance(name, query, inst, span).chain((sub) => {
    if (rest.length === 0) {
      return successfulResult(sub);
    }
    return walkInstance(sub, context, compRef(rest), query);
  });
}

function extractNamedInstance(
  name: string,
  query: QueryHandler,
  inst: Instance,
  span: ProblemSpan
): Result<Instance> {
  switch (inst.kind) {
    case "model":
      const def = query(inst.def);
      const con = inst.connectors[name];
      if (con !== undefined) {
        return successfulResult(con);
      }
      const comp = inst.components[name];
      if (comp !== undefined) {
        return comp();
      }
      const param = inst.parameters[name];
      if (param !== undefined) {
        return successfulResult(param);
      }
      const sparam = inst.structural[name];
      if (sparam !== undefined) {
        return successfulResult(sparam);
      }
      const v = inst.variables[name];
      if (v !== undefined) {
        return successfulResult(v);
      }
      const com = inst.pathVariables[name];
      if (com !== undefined) {
        return successfulResult(com);
      }
      return failedResult(
        unknownElement(
          name,
          `The name '${name}' was not found in component '${def.name.value}'. It might be a misspelled variable or parameter, a missing declaration, or an undeclared sub-component/connector.`,
          span
        )
      );
    case "comp": {
      const def = query(inst.instance.def);

      return instantiateModel(def, inst.mods, null, query).chain((ci) => {
        return extractNamedInstance(name, query, ci, span);
      });
    }
    case "strcon":
      for (const elem of inst.elems) {
        if (elem.name === name) {
          return successfulResult(elem);
        }
      }
      return failedResult(
        unknownElement(
          name,
          `Unable to find field ${name} in instance of connector ${inst.def.name.value}`,
          span
        )
      );
    case "con":
      return failedResult(
        new CompilerAssertionError(
          name,
          `Walking of con instance to find field named ${name} is not yet supported`
        )
      );
    case "sclcon":
      return failedResult(
        new CompilerAssertionError(
          name,
          `Walking of sclcon instance to find field named ${name} is not yet supported`
        )
      );
    case "vari":
      return failedResult(
        new CompilerAssertionError(
          name,
          `Walking of vari instance to find field named ${name} is not yet supported`
        )
      );
    case "cvari":
      return failedResult(
        new CompilerAssertionError(
          name,
          `Walking of cvari instance to find field named ${name} is not yet supported (${JSON.stringify(
            inst
          )})`
        )
      );
    default:
      assertUnreachable(inst);
  }
}
