import { assertUnreachable, Result } from "@juliacomputing/dyad-common";
import { DefinitionEntity } from "../entities/definitions.js";
import { Selector } from "../selector.js";
import { EntityType } from "../newtypes/index.js";
import { getDefinitionNode } from "../selectors/index.js";
import { resolveBuiltinEntityType, resolveScalarType } from "./scalar.js";
import { Definition } from "@juliacomputing/dyad-ast";
import {
  resolveCompoundConnectorType,
  resolveScalarConnectorType,
} from "./connector.js";
import { BuiltinEntity, isBuiltinEntity } from "../entities/builtin.js";
import { resolveStructType } from "./struct.js";
import { resolveEnumType } from "./enum.js";
import { resolveFunctionType } from "./fun.js";
import { resolveAnalysisType } from "./analysis.js";
import { resolveComponentType } from "./component.js";

/**
 * Given a references to an definition entity, formulate an expression of that
 * entities type.
 *
 * NB - This can be quite effectively cached whereas the `ASTNode` based version
 * cannot really.  So I need to think another pass will be useful to refactor
 * this to optimize for caching.  But I don't want to complicate the current
 * work of just getting this implemented.
 *
 * @param e
 * @returns
 */
export function resolveEntityType(
  e: DefinitionEntity | BuiltinEntity
): Selector<Result<EntityType>> {
  return ({ query }) =>
    isBuiltinEntity(e)
      ? resolveBuiltinEntityType(e)
      : query(getDefinitionNode(e)).chain((node) =>
          query(resolveNodeType(node))
        );
}

/**
 * Resolve the type of an AST node.  This function is problematic because it is not
 * so easy to cache (see @see resolveEntitytType ).
 *
 * @param node
 * @returns
 */
export function resolveNodeType(
  node: Definition
): Selector<Result<EntityType>> {
  switch (node.kind) {
    case "scalar":
      return resolveScalarType(node);
    case "sclcon":
      return resolveScalarConnectorType(node);
    case "struct":
      return resolveStructType(node, node);
    case "enum":
      return resolveEnumType(node);
    case "fun":
      return resolveFunctionType(node);
    case "strcon":
      return resolveCompoundConnectorType(node);
    case "adef":
      return resolveAnalysisType(node);
    case "cdef":
      return resolveComponentType(node);
    default:
      assertUnreachable(node);
  }
}
