import {
  Declaration,
  Definition,
  Expression,
  ProblemSpan,
} from "@juliacomputing/dyad-ast";
import {
  assertUnreachable,
  Nullable,
  Problem,
  Result,
} from "@juliacomputing/dyad-common";
import { arrayOf } from "../newtypes/array.js";
import { conditionalDeclaration } from "../newtypes/conditional.js";
import {
  ComplexType,
  isVariableInstanceType,
  VariableDeclarationType,
  VariableInstanceType,
} from "../newtypes/types.js";
import {
  ComponentInstanceType,
  isComponentInstanceType,
} from "../newtypes/component.js";
import { AnalysisInstanceType } from "../newtypes/analysis.js";
import {
  ConnectorInstanceType,
  isConnectorInstanceType,
} from "../newtypes/connectors.js";
import { DefinitionEntity } from "../entities/definitions.js";
import { applyModifications } from "../modifications/apply.js";
import { Selector } from "../selector.js";
import { resolveQualifiedType } from "./qualified.js";
import {
  ComponentElement,
  componentElement,
  ConnectorElement,
  connectorElement,
  VariableElement,
  variableElement,
} from "../newtypes/declaration.js";
import { existingElement } from "../../instantiate/index.js";
import { describeEntity } from "../entities/index.js";

/**
 * This function takes a given instance type and wraps it
 * in a conditional and/or array type as indicated by the
 * underlying declaration's `cond` and `dims` properties.
 *
 * @param bare
 * @param cond
 * @param dims
 * @returns
 */
export function declarationType<
  T extends
    | VariableInstanceType
    | ComponentInstanceType
    | ConnectorInstanceType
    | AnalysisInstanceType,
>(bare: T, cond: Nullable<Expression>, dims: Expression[]): ComplexType<T> {
  if (cond === null) {
    if (dims.length === 0) {
      return bare;
    } else {
      return arrayOf(bare, dims);
    }
  }

  if (dims.length === 0) {
    return conditionalDeclaration(bare, cond);
  } else {
    return conditionalDeclaration(arrayOf(bare, dims), cond);
  }
}

/**
 * Process a declaration and return the type information about that declaration
 * (_i.e.,_ the `*Element` information).  This "Element" information includes
 * not just the type of the variable, component or connector but also any
 * qualifiers associated with the declaration.
 *
 * @param decl
 * @param node
 * @param origin
 * @returns
 */
export function resolveDeclarationType(
  decl: Declaration,
  node: Definition,
  origin: DefinitionEntity
): Selector<Result<ConnectorElement | ComponentElement | VariableElement>> {
  return ({ query }) => {
    switch (decl.kind) {
      case "cdecl": {
        const bare = query(
          resolveQualifiedType(
            decl.instance,
            node,
            (v) => isComponentInstanceType(v) || isConnectorInstanceType(v),
            "a connector or subcomponent"
          )
        );
        const bar = bare.chain<ConnectorElement | ComponentElement>((v) => {
          if (isComponentInstanceType(v)) {
            const declType = applyModifications(
              declarationType(v, decl.cond, decl.dims),
              decl.instance.mods,
              node
            );
            return declType.map((v) => componentElement(v, origin, false));
          } else {
            const declType = applyModifications(
              declarationType(v, decl.cond, decl.dims),
              decl.instance.mods,
              node
            );
            return declType.map((v) => connectorElement(v, origin));
          }
        });
        return bar;
      }
      case "var": {
        const bare = query(
          resolveQualifiedType(
            decl.type,
            node,
            isVariableInstanceType,
            "a value type"
          )
        );
        const declType: Result<VariableDeclarationType> = bare
          .map((v) => declarationType(v, decl.cond, decl.dims))
          .chain((t) => applyModifications(t, decl.type.mods, node));

        return declType.map((x) =>
          variableElement(x, origin, decl.final, decl.variability)
        );
      }
      default:
        assertUnreachable(decl);
    }
  };
}

/**
 * Determines if a given component already exists in the `ComponentInstanceType`
 * being created and, if so, it reports it as a problem.
 *
 * @param name
 * @param i
 * @param ret
 * @param def
 * @param problems
 * @returns
 */
export function checkForExisting(
  name: string,
  categories: Array<Map<string, any>>,
  def: Definition,
  problems: Problem[],
  span: ProblemSpan
): boolean {
  const reportExists = (origin: DefinitionEntity) =>
    problems.push(
      existingElement(
        name,
        `Connector ${name} already exists and was inherited from ${describeEntity(
          origin
        )}`,
        span
      )
    );

  for (const cat of categories) {
    const con = cat.get(name);
    if (con !== undefined) {
      reportExists(con.origin);
      return true;
    }
  }

  return false;
}
