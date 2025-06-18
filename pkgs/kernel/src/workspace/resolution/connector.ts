import {
  ConnectionVariableDeclaration,
  qualifiedName,
  ScalarConnectorDefinition,
  StructConnectorDefinition,
} from "@juliacomputing/dyad-ast";
import {
  compoundConnectorInstanceType,
  CompoundConnectorInstanceType,
  scalarConnectorInstanceType,
  ScalarConnectorInstanceType,
} from "../newtypes/connectors.js";
import { partialResult, Problem, Result } from "@juliacomputing/dyad-common";
import { Selector } from "../selector.js";
import { UnexpectedTypeError } from "../../instantiate/errors.js";
import { isBuiltinEntity } from "../entities/builtin.js";
import { lookupQualifiedType } from "../selectors/symbols.js";
import { problemSpan } from "../utils.js";
import { resolveEntityType } from "./entity.js";
import { resolveBuiltinEntityType } from "./scalar.js";
import { isScalarType } from "../newtypes/scalar.js";
import { applyModifications } from "../modifications/apply.js";
import { isVariableInstanceType } from "../newtypes/types.js";
import { declarationType } from "./decl.js";
import { resolveQualifiedType } from "./qualified.js";
import { FieldElement, fieldElement } from "../newtypes/declaration.js";
import { getDefinitionEntity } from "../selectors/entities.js";

/**
 * Resolve the type for a scalar connector
 *
 * @param node
 * @returns
 */
export function resolveScalarConnectorType(
  node: ScalarConnectorDefinition
): Selector<Result<ScalarConnectorInstanceType>> {
  return ({ query }) => {
    /** Look up the entity for the type we are extending from */
    const baseEntity = query(lookupQualifiedType(node.type.name, node));
    const baseType = baseEntity.chain((e) => {
      // If it is a builtin, return an "empty" builtin type
      if (isBuiltinEntity(e)) {
        return resolveBuiltinEntityType(e);
      } else {
        // Otherwise, lookup the type of the base entity and ensure that it
        // is a scalar type
        return query(resolveEntityType(e)).filter(isScalarType, (v) =>
          UnexpectedTypeError(
            qualifiedName(node.type),
            `Expected ${qualifiedName(node.type)} in ${
              node.name.value
            } to be a scalar type, but it was ${v.resolves}`,
            problemSpan(node, node.type.span)
          )
        );
      }
    });
    // At this point, we have a scalar type so let's now apply the modification
    // associated with the `extends` clause to it and return the result.
    return baseType
      .map((b) => scalarConnectorInstanceType(b, node.qualifier))
      .chain((t) => applyModifications(t, node.type.mods, node));
  };
}

/**
 * Resolve the type for a compound connector
 *
 * @param node
 * @returns
 */
export function resolveCompoundConnectorType(
  node: StructConnectorDefinition
): Selector<Result<CompoundConnectorInstanceType>> {
  return ({ query }) => {
    const problems: Problem[] = [];
    const ret = compoundConnectorInstanceType();
    for (const [dn, decl] of Object.entries(node.elements)) {
      query(structConnectorDeclarationType(decl, node)).ifResult((t) => {
        ret.fields.set(dn, t);
      }, problems);
    }
    return partialResult(ret, ...problems);
  };
}

/**
 * Build the type for individual declarations within a
 * compound connector
 *
 * @param decl
 * @param def
 * @returns
 */
function structConnectorDeclarationType(
  decl: ConnectionVariableDeclaration,
  def: StructConnectorDefinition
): Selector<Result<FieldElement>> {
  return ({ query }) => {
    const origin = query(getDefinitionEntity(def));
    // Get the bare type for each field
    const bare = query(
      resolveQualifiedType(
        decl.type,
        def,
        isVariableInstanceType,
        "a variable type"
      )
    );
    // Create a type expressions that takes into account array and
    // conditional properties.
    const declType = bare.map((v) => declarationType(v, decl.cond, decl.dims));
    // Apply modifications
    const modified = declType.chain((t) =>
      applyModifications(t, decl.type.mods ?? {}, def)
    );
    // Add declaration specific type information
    return modified.map((t) => fieldElement(t, origin, decl.qualifier));
  };
}
