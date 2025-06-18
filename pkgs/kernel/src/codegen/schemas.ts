import { Expression, ComponentDefinition } from "@juliacomputing/dyad-ast";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { instantiateModel, normalizeBaseType } from "../instantiate/index.js";
import {
  Problem,
  assertUnreachable,
  createError,
  Result,
  partialResult,
} from "@juliacomputing/dyad-common";
import { Either, Left, Right } from "purify-ts/Either";
import { ifEither } from "../result.js";
import { UnimplementedError } from "../workspace/errors.js";
import {
  getMaxAttribute,
  getMinAttribute,
  QueryHandler,
} from "../workspace/index.js";

const unexpectedType = createError("unexpected-type", "Unexpected type");

export function generateZod(
  model: ComponentDefinition,
  query: QueryHandler
): Result<z.ZodType<any, z.ZodTypeDef, any>> {
  return instantiateModel(model, {}, null, query).chain((instance) => {
    const shape: Record<string, z.ZodType<any, z.ZodTypeDef, any>> = {};
    const problems: Problem[] = [];

    for (const [cn, comp] of Object.entries(instance.parameters)) {
      switch (comp.type.resolves) {
        case "scalar":
          const base = normalizeBaseType(comp.type);
          const mods = comp.attributes;
          switch (base) {
            case "Real": {
              let schema = z.number();
              if (comp.doc_string !== null) {
                schema = schema.describe(comp.doc_string.value);
              }

              getMinAttribute(mods).ifJust((v) => {
                schema = schema.gte(v);
              });
              getMaxAttribute(mods).ifJust((v) => {
                schema = schema.lte(v);
              });
              shape[cn] = schema;

              comp.default.ifJust((x) => {
                ifEither(getRealEither(x), problems, (v) => {
                  shape[cn] = schema.default(v);
                });
              });
              break;
            }
            case "Integer": {
              let schema = z.number();

              getMinAttribute(mods).ifJust((v) => {
                schema = schema.gte(v);
              });
              getMaxAttribute(mods).ifJust((v) => {
                schema = schema.lte(v);
              });

              shape[cn] = schema;

              comp.default.ifJust((x) => {
                ifEither(getIntEither(x), problems, (v) => {
                  shape[cn] = schema.default(v);
                });
              });
              break;
            }
            case "String": {
              let schema = z.string();
              if (comp.doc_string !== null) {
                schema = schema.describe(comp.doc_string.value);
              }
              shape[cn] = schema;
              comp.default.ifJust((x) => {
                ifEither(getStringEither(x), problems, (v) => {
                  shape[cn] = schema.default(v);
                });
              });
              break;
            }
            case "Boolean": {
              let schema = z.boolean();
              if (comp.doc_string !== null) {
                schema = schema.describe(comp.doc_string.value);
              }
              shape[cn] = schema;
              comp.default.ifJust((x) => {
                ifEither(getBooleanEither(x), problems, (v) => {
                  shape[cn] = schema.default(v);
                });
              });
              break;
            }
            /* istanbul ignore next */
            default:
              assertUnreachable(base);
          }
          break;
        default:
          throw new UnimplementedError(
            "generateZod",
            `The generateZod function currently cannot handle ${comp.type.resolves} types`
          );
      }
    }
    return partialResult(z.object(shape), ...problems);
  });
}

export function generateSchema(
  model: ComponentDefinition,
  query: QueryHandler
) {
  return generateZod(model, query).map((v) => zodToJsonSchema(v));
}

export function getRealEither(e: Expression): Either<Problem, number> {
  if (e.type === "ilit" || e.type === "rlit") {
    return Right(e.value);
  } else {
    return Left(
      new unexpectedType(
        e.type,
        `Expected real value, but got literal of type ${e.type}`
      )
    );
  }
}

export function getIntEither(e: Expression): Either<Problem, number> {
  if (e.type === "ilit") {
    return Right(e.value);
  } else {
    return Left(
      new unexpectedType(
        e.type,
        `Expected integer value, but got literal of type ${e.type}`
      )
    );
  }
}

export function getBooleanEither(e: Expression): Either<Problem, boolean> {
  if (e.type === "blit") {
    return Right(e.value);
  } else {
    return Left(
      new unexpectedType(
        e.type,
        `Expected boolean value, but got literal of type ${e.type}`
      )
    );
  }
}

export function getStringEither(e: Expression): Either<Problem, string> {
  if (e.type === "slit") {
    return Right(e.value);
  } else {
    return Left(
      new unexpectedType(
        e.type,
        `Expected string value, but got literal of type ${e.type}`
      )
    );
  }
}
