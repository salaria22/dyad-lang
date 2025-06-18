import {
  DocString,
  Expression,
  VariableDeclaration,
  Definition,
  qualifiedName,
  Modifications,
  Variability,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import {
  DefinitionEntity,
  problemSpan,
  QueryHandler,
  ResolvedType,
} from "../workspace/index.js";
import {
  failedResult,
  Nullable,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { CompilerAssertionError } from "../workspace/errors.js";
import { ResolvedScalarType, resolveType } from "../workspace/types/index.js";
import { finalNoInit } from "./errors.js";
import { Maybe } from "purify-ts/Maybe";

export type BaseType = "Real" | "Integer" | "Boolean" | "String";

export interface VariableInstance {
  kind: "vari";
  /**
   * The type of the variable
   */
  type: ResolvedType;
  /**
   * Variability of this instance
   */
  qualifier: Variability;
  /**
   * The _complete_ set of modifications for this variable (includes those
   * from the type as well as those injected at instantiation)
   */
  attributes: Modifications;
  /**
   * This is the documentation for the _instance_
   */
  doc_string: Nullable<DocString>;
  /**
   * Indicates whether a default value for this variable was provided
   */
  default: Maybe<Expression>;
  /**
   * Array dimensions
   */
  dims: Array<Expression>;
  /**
   * Whether the instance default value is fine
   */
  final: boolean;
  /**
   * Which definition this appeared in
   */
  origin: DefinitionEntity;
  /**
   * Span for the original declaration
   */
  declarationSpan: Nullable<TextualSpan>;
}

export function instantiateVariable(
  name: string,
  v: VariableDeclaration,
  origin: DefinitionEntity,
  model: Definition,
  query: QueryHandler
): Result<VariableInstance> {
  const either = query(resolveType(v.type.name, model, []));

  return either.chain((st): Result<VariableInstance> => {
    if (v.final && v.init === undefined) {
      return failedResult(
        finalNoInit(
          name,
          `A parameter marked as final must have an initialization expression`,
          problemSpan(model, v.span)
        )
      );
    }

    switch (st.resolves) {
      case "fun": {
        let attributes: Modifications = { ...v.type.mods };
        const ret: VariableInstance = {
          kind: "vari",
          type: st,
          qualifier: v.variability,
          attributes: attributes,
          doc_string: v.doc_string,
          final: v.final,
          default: Maybe.fromNullable(v.init),
          dims: v.dims,
          origin,
          declarationSpan: v.span,
        };
        return successfulResult(ret);
      }
      case "struct": {
        let attributes: Modifications = { ...v.type.mods };
        const ret: VariableInstance = {
          kind: "vari",
          type: st,
          qualifier: v.variability,
          attributes: attributes,
          doc_string: v.doc_string,
          final: v.final,
          default: Maybe.fromNullable(v.init),
          dims: v.dims,
          origin,
          declarationSpan: v.span,
        };
        return successfulResult(ret);
      }
      case "scalar": {
        let attributes: Modifications = { ...st.mods, ...v.type.mods };
        const ret: VariableInstance = {
          kind: "vari",
          type: st,
          qualifier: v.variability,
          attributes: attributes,
          doc_string: v.doc_string,
          final: v.final,
          default: Maybe.fromNullable(v.init),
          dims: v.dims,
          origin,
          declarationSpan: v.span,
        };
        return successfulResult(ret);
      }
      case "enum": {
        let attributes: Modifications = { ...v.type.mods };
        const ret: VariableInstance = {
          kind: "vari",
          type: st,
          qualifier: v.variability,
          attributes: attributes,
          doc_string: v.doc_string,
          final: v.final,
          default: Maybe.fromNullable(v.init),
          dims: v.dims,
          origin,
          declarationSpan: v.span,
        };
        return successfulResult(ret);
      }
      default: {
        return failedResult(
          new CompilerAssertionError(
            "instantiateVariable",
            `Expected ${name} to be a scalar, struct or function type, but it wasn't`,
            problemSpan(model, model.span)
          )
        );
      }
    }
  });
}

export function resolveSpecificType(st: ResolvedScalarType) {
  return st.derived.mapOrDefault<string>(
    (x) => x.name.value,
    qualifiedName(st.base)
  );
}

export function normalizeBaseType(st: ResolvedScalarType): BaseType {
  const x = qualifiedName(st.base);
  switch (x) {
    case "Real":
    case "Integer":
    case "Boolean":
    case "String":
      return x;
  }
  /* istanbul ignore next */
  throw new CompilerAssertionError(
    x,
    `Got base type of '${x}' which was not one of the expected values`
  );
}
