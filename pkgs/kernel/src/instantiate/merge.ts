import { Problem } from "@juliacomputing/dyad-common";
import { existingElement } from "./errors.js";
import { ModelInstance } from "./model.js";
import { ProblemSpan } from "@juliacomputing/dyad-ast";

// FIX: This current ignores the metadata.  It needs to be merged.  But it also
// needs to be order independent.  In practice, this means conflicts just have to
// removed.
export function mergeInstance(
  base: ModelInstance,
  extend: ModelInstance,
  span: ProblemSpan
): Problem[] {
  const problems: Problem[] = [];
  // Note, we can ignore the partial status of an extends

  function fold<V>(
    field: string,
    br: Record<string, V>,
    er: Record<string, V>
  ) {
    for (const [cn, c] of Object.entries(er)) {
      if (exists(base, cn)) {
        problems.push(
          existingElement(
            cn,
            `Cannot inherit ${field} ${cn} from ${extend.name.value} because a field with that name was already inherited from a different model`,
            span
          )
        );
        continue;
      }
      br[cn] = c;
    }
  }

  fold("connector", base.connectors, extend.connectors);
  fold("component", base.components, extend.components);
  fold("variable", base.variables, extend.variables);
  fold("parameter", base.parameters, extend.parameters);

  base.continuityStatements = base.continuityStatements.concat(
    extend.continuityStatements
  );
  base.relations = base.relations.concat(extend.relations);

  return problems;
}

function exists(inst: ModelInstance, name: string): boolean {
  return (
    inst.connectors[name] !== undefined ||
    inst.components[name] !== undefined ||
    inst.variables[name] !== undefined ||
    inst.parameters[name] !== undefined
  );
}
