import { ModelInstance, nestedInstance } from "./model.js";
import {
  ComponentDeclaration,
  ComponentDefinition,
  Expression,
  QualifiedType,
  componentDeclaration,
  createToken,
  hasExpression,
  metadataNode,
  modification,
  qualifiedName,
  qualifiedType,
} from "@juliacomputing/dyad-ast";
import {
  UnexpectedTypeError,
  illegalExtendType,
  unknownElement,
} from "./errors.js";
import { instantiateModel } from "./model.js";
import {
  CompilerAssertionError,
  UnimplementedError,
} from "../workspace/errors.js";
import {
  Result,
  failedResult,
  objectMap,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { problemSpan } from "../workspace/utils.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { ComponentInstance } from "./component.js";
import { QueryHandler, resolveType } from "../workspace/index.js";

export function extendInstance(
  extend: QualifiedType,
  model: ComponentDefinition,
  query: QueryHandler
): Result<ModelInstance> {
  return (
    /** Resolve the name of the definition being extended */
    query(resolveType(extend.name, model, []))
      /**
       * Assuming it resolved, construct a `ModelInstance` representing the
       * component being extended **plus** any modifications applied.
       **/
      .chain((resolved): Result<ModelInstance> => {
        // Check if this is a component definition we are extending...
        if (resolved.resolves === "cdef") {
          // Get the underlying definition of _what we are extending_
          const edef = resolved.def;
          // Instantiate the component being extended.
          return instantiateModel(
            edef,
            extend.mods || {}, // This is just recorded, it isn't acted upon
            null,
            query
          ).chain((einst): Result<ModelInstance> => {
            // Now we need to apply modifications.
            for (const [comp, expr] of Object.entries(extend.mods || {})) {
              if (!hasExpression(expr)) {
                continue;
              }
              // Check to see if this modification is overriding the value of an
              // existing parameter
              if (Object.hasOwn(einst.parameters, comp)) {
                einst.parameters[comp].default = Just(expr.expr);
                continue;
              }
              // Check to see if this modification is overriding the value of an
              // existing variable (currently this isn't semantically meaningful
              // in Dyad)
              if (Object.hasOwn(einst.variables, comp)) {
                einst.variables[comp].default = Just(expr.expr);
                continue;
              }
              // Check to see if this modification is trying to replace an existing
              // component with a different instance
              if (
                Object.hasOwn(einst.components, comp) &&
                hasExpression(expr)
              ) {
                replaceComponent(
                  einst.components[comp],
                  expr.expr,
                  comp,
                  model,
                  query
                ).ifJust((v) => {
                  einst.components[comp] = v;
                });
                continue;
              }
              return failedResult(
                unknownElement(
                  comp,
                  `Unknown elements ${comp} when extending ${qualifiedName(
                    extend
                  )} in ${model.name.value}`,
                  problemSpan(model, extend.span)
                )
              );
            }
            return successfulResult(einst);
          });
        } else {
          // If we get here, this is **not** a component definition so we return
          // a failed result.
          const etype = extend.name.map((x) => x.value).join(".");
          const key = model.source;
          return failedResult(
            illegalExtendType(
              etype,
              `Attempt to extend from non-model ${etype} in ${model.name.value}`,
              { file: key, span: extend.span }
            )
          );
        }
      })
  );
}

export function replaceComponent(
  prev: () => Result<ComponentInstance>,
  expr: Expression,
  compName: string,
  model: ComponentDefinition,
  query: QueryHandler
): Maybe<() => Result<ComponentInstance>> {
  const previousInstance = prev();
  // The syntax for this must be a function call where the name
  // contains now array dereferences.
  if (expr.type === "call") {
    /* istanbul ignore next */
    if (expr.func.elems.some((x) => x.indices.length > 0)) {
      throw new UnimplementedError(
        "extendInstance",
        "cannot handle complex type name in extends"
      );
    }
    // Create the token array from the name (with dimensions stripped)
    const tokens = expr.func.elems.map((x) => createToken(x.name, x.span));
    // This is a token representing the component name
    const componentNameToken = createToken(compName, null);
    // Turn the function call into a QualifiedType.
    const instance = qualifiedType(
      tokens,
      objectMap(expr.keyword, (x) => modification(false, x, null, null)),
      expr.span
    );

    // Create an "updated" component declaration so we can instantiate
    // based on this.
    const metadata = previousInstance.mapOrDefault<{}>((x) => x.metadata, {});
    const decl: ComponentDeclaration = componentDeclaration(
      componentNameToken,
      instance,
      null,
      [],
      [],
      null,
      null,
      metadataNode(metadata, null),
      null
    );
    // Resolve the type of the name specified by the `QualifiedType`.
    const res = query(resolveType(tokens, model, []));

    if (res.hasValue()) {
      const resolve = res.value;
      if (resolve.resolves === "cdef") {
        const builder = nestedInstance(
          compName,
          decl,
          model,
          resolve.def,
          query
        );
        return Just(builder);
      } else {
        // Construct the name of the qualified type
        const qn = qualifiedName(instance);

        throw UnexpectedTypeError(
          qn,
          `Instance of ${qn} resolves to a ${resolve.resolves} type, expected cdef`,
          problemSpan(model, tokens[0].span)
        );
      }
    }
    return Nothing;
  } else {
    /* istanbul ignore next */
    throw new CompilerAssertionError(
      "extendInstance",
      "expected function call expression"
    );
  }
}
