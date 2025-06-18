import {
  QualifiedType,
  Definition,
  qualifiedName,
} from "@juliacomputing/dyad-ast";
import { Result } from "@juliacomputing/dyad-common";
import { invalidEntity } from "../entities/errors.js";
import { DyadDeclarationType } from "../newtypes/types.js";
import { Selector } from "../selector.js";
import { lookupQualifiedType } from "../selectors/symbols.js";
import { problemSpan } from "../utils.js";
import { resolveEntityType } from "./entity.js";

/**
 * This routine is widely used when resolving types.  It performs the following
 * steps:
 * 1. Look up a given qualified type (series of `Token`s) and determine what
 *    entity they refer to.
 * 2. Resolve the type of that entity.
 * 3. Check that the type is of the expected type.
 *
 * This is used to resolve the types of `extends` clauses, inherited scalar
 * types and declarations.
 *
 * @param qualified
 * @param context
 * @param pred
 * @param expected
 * @returns
 */
export function resolveQualifiedType<T extends DyadDeclarationType>(
  qualified: QualifiedType,
  context: Definition,
  pred: (x: DyadDeclarationType) => x is T,
  expected: string
): Selector<Result<T>> {
  return ({ query }) => {
    // First, we get the entity associated with the qualified type
    const entity = query(lookupQualifiedType(qualified.name, context));
    // Next, we resolve the type associated with that entity
    const type = entity.chain((e) => query(resolveEntityType(e)));
    // Finally, we check that the type is a variable instance type
    return type.filter(pred, (v) =>
      invalidEntity(
        qualifiedName(qualified),
        `Expected type of ${qualifiedName(
          qualified
        )} to be ${expected} but it was ${v.resolves}`,
        problemSpan(context, qualified.span)
      )
    ) as Result<T>;
  };
}
