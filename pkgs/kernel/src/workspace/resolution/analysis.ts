import {
  AnalysisDefinition,
  hasExpression,
  qualifiedName,
} from "@juliacomputing/dyad-ast";
import {
  buf2str,
  failedResult,
  partialResult,
  Problem,
  Result,
  toProblems,
  uriScheme,
  baseLibraryName,
} from "@juliacomputing/dyad-common";
import { Selector } from "../selector.js";
import { resolveQualifiedType } from "./qualified.js";
import { checkForExisting, resolveDeclarationType } from "./decl.js";
import { getDefinitionEntity } from "../selectors/index.js";
import { problemSpan } from "../utils.js";
import {
  describeEntity,
  invalidEntity,
  definitionEntity,
} from "../entities/index.js";
import {
  invalidSchema,
  missingSchema,
  unsupportedSchemaType,
} from "./errors.js";

import { validate } from "jsonschema";
import { JsonSchema7ObjectType } from "zod-to-json-schema";
import {
  analysisInstanceType,
  AnalysisInstanceType,
  isAnalysisInstanceType,
  componentInstanceType,
  integerType,
  componentElement,
  variableElement,
  stringType,
  booleanType,
  realType,
} from "../newtypes/index.js";
import { Maybe } from "purify-ts";
import { draft7MetaSchema } from "./draft7.js";

/**
 * Given an `AnalysisDefinition`, create a representation of the type
 * for an instance of that analysis.
 *
 * @param node
 * @returns
 */
export function resolveAnalysisType(
  node: AnalysisDefinition
): Selector<Result<AnalysisInstanceType>> {
  return ({ query }) => {
    const problems: Problem[] = [];
    const qn = qualifiedName(node.extends);

    /**
     * If extending from the "built-in" `Analysis` type, then handle that
     * specially...
     */
    const ret =
      qn === "Analysis"
        ? query(resolveBaseAnalysisType(node))
        : query(
            resolveQualifiedType(
              node.extends,
              node,
              isAnalysisInstanceType,
              "an analysis definition"
            )
          );

    const origin = query(getDefinitionEntity(node));

    ret.ifResult((inst) => {
      const categories = [inst.components, inst.parameters];
      /** Add local declarations to the instance */
      for (const [name, decl] of Object.entries(node.declarations)) {
        if (
          checkForExisting(
            name,
            categories,
            node,
            problems,
            problemSpan(node, decl.span)
          )
        ) {
          continue;
        }

        /** Resolve the type of the declaration we are working with */
        const elem = query(resolveDeclarationType(decl, node, origin));

        /** If it could be resolved, then handle it based on its type */
        elem.ifResult((v) => {
          switch (v.elem) {
            case "component": {
              /** If it is a component, just add it */
              inst.components.set(name, v);
              break;
            }
            case "connector": {
              /** If it is a connector, then this is a problem */
              problems.push(
                invalidEntity(
                  name,
                  `Element ${name} is a connector, connectors are not allowed in analyses`,
                  problemSpan(node, decl.span)
                )
              );
              break;
            }
            /**
             * If this is a variable and a parameter, then add it.  But if it
             * isn't a parameter, that's a problem.
             **/
            case "variable": {
              if (v.variability === "parameter") {
                inst.parameters.set(name, v);
              } else {
                problems.push(
                  invalidEntity(
                    name,
                    `Element ${name} is a (non-parameter) variable), variables are not allowed in analyses`,
                    problemSpan(node, decl.span)
                  )
                );
              }
            }
          }
        }, problems);
      }
    }, problems);
    return ret;
  };
}

/**
 * This function resolves the base type of an analysis, which is constructed
 * based on the contents of the analysis schema.
 *
 * @param node
 * @returns
 */
function resolveBaseAnalysisType(
  node: AnalysisDefinition
): Selector<Result<AnalysisInstanceType>> {
  return ({ query, fetch }) => {
    const entity = query(getDefinitionEntity(node));

    const schemaSpan = problemSpan(node, node.extends.span);
    const attrError = (name: string, field: string, required: string, v: any) =>
      invalidSchema(
        `${entity}/${name}`,
        `${field} value for ${name} must be ${required}, got ${JSON.stringify(
          v
        )}`,
        schemaSpan
      );

    /** Try to locate and load the schema. */
    const schemaUri = node.extends?.mods?.analysisSchema;
    if (schemaUri === undefined) {
      return failedResult(
        missingSchema(
          entity,
          `Analysis ${describeEntity(entity)} has no schema`,
          schemaSpan
        )
      );
    }
    if (!hasExpression(schemaUri)) {
      return failedResult(
        missingSchema(
          entity,
          `Analysis ${describeEntity(
            entity
          )} string missing for analysisSchema`,
          schemaSpan
        )
      );
    }
    if (schemaUri.expr.type !== "slit") {
      return failedResult(
        missingSchema(
          entity,
          `Analysis ${describeEntity(
            entity
          )} expected string for analysisSchema, got ${schemaUri.expr.type}`,
          schemaSpan
        )
      );
    }
    const resp = fetch(schemaUri.expr.value);

    /** Process the schema, if we found one. */
    return resp.chain((r) => {
      try {
        /** Parse the JSON and validate (synchronously!) that it is a schema */
        const obj = JSON.parse(buf2str(r.contents));
        const v = validate(obj, draft7MetaSchema);
        if (!v.valid) {
          const problems = v.errors.map((e) => {
            return invalidSchema(
              `${entity}/${e.instance}`,
              `Schema for ${describeEntity(entity)} is invalid: ${e.message}`,
              problemSpan(node, node.metadata?.span ?? node.span)
            );
          });
          return failedResult(problems[0], ...problems.slice(1));
        }

        /** Create an initially empty return value */
        const problems: Problem[] = [];
        const ret = analysisInstanceType(entity);

        /** Case the data as a Draft 07 JSON Schema */
        const data: JsonSchema7ObjectType = obj as any;
        if (data.type !== "object") {
          return failedResult(
            invalidSchema(
              `${entity}`,
              `Schema for ${describeEntity(entity)} is not an object`,
              schemaSpan
            )
          );
        }

        /** Assume this schema is an object and iterate over its properties */
        for (const [name, prop] of Object.entries(data.properties)) {
          const instance = `${entity}/${name}`;
          const pa = prop as any;

          /** If this as the `dyad:type` component hint, set the type to be an empty component */
          if (pa[`${uriScheme}:type`] === "component") {
            const t = componentInstanceType(
              definitionEntity(baseLibraryName, [], "Empty")
            );
            ret.components.set(name, componentElement(t, entity, false));
            continue;
          }

          /** Otherwise, react based on the type... */
          const type = pa["type"];
          switch (type) {
            /** Add a boolean parameter */
            case "boolean": {
              ret.parameters.set(
                name,
                variableElement(booleanType({}), entity, false, "parameter")
              );
              break;
            }
            /** Add an integer parameter */
            case "integer": {
              let min = pa.minimum;
              if (min !== undefined && !Number.isInteger(min)) {
                problems.push(attrError(name, "min", "an integer", min));
                min = undefined;
              }
              let max = pa.maximum;
              if (max !== undefined && !Number.isInteger(max)) {
                problems.push(attrError(name, "max", "an integer", max));
                max = undefined;
              }
              ret.parameters.set(
                name,
                variableElement(
                  integerType({
                    min: Maybe.fromNullable(min),
                    max: Maybe.fromNullable(max),
                  }),
                  entity,
                  false,
                  "parameter"
                )
              );
              break;
            }
            /** Add a real parameter */
            case "number": {
              let min = pa.minimum;
              if (min !== undefined && typeof min !== "number") {
                problems.push(attrError(name, "min", "a number", min));
                min = undefined;
              }
              let max = pa.maximum;
              if (max !== undefined && typeof min !== "number") {
                problems.push(attrError(name, "max", "a number", max));
                max = undefined;
              }
              ret.parameters.set(
                name,
                variableElement(
                  realType({
                    min: Maybe.fromNullable(min),
                    max: Maybe.fromNullable(max),
                  }),
                  entity,
                  false,
                  "parameter"
                )
              );
              break;
            }
            /** Add a string parameter */
            case "string": {
              ret.parameters.set(
                name,
                variableElement(stringType, entity, false, "parameter")
              );
              break;
            }
            /** These are all currently unsupported */
            case "array":
            case "object":
            case "null":
            default:
              problems.push(
                unsupportedSchemaType(
                  instance,
                  `Field ${name} in schema for ${describeEntity(
                    entity
                  )} has unsupported type ${type}`,
                  schemaSpan
                )
              );
              break;
          }
        }
        return partialResult(ret, ...problems);
      } catch (e: any) {
        return failedResult(...toProblems(e));
      }
    });
  };
}
