import {
  failedResult,
  Nullable,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { CompilerAssertionError, InfiniteTypeRecursion } from "../errors.js";
import {
  boundingSpan,
  builtinTypes,
  Definition,
  SourceKey,
  Token,
} from "@juliacomputing/dyad-ast";
import { resolveDefinition } from "./operations.js";
import {
  describeEntity,
  getDefinitionEntity,
  isBuiltinEntity,
  libraryEntity,
  moduleEntity,
  problemSpan,
  QueryHandler,
  queryType,
  resolvedScalar,
  Selector,
  unknownType,
  unparseBuiltinEntity,
  unparseDefinitionEntity,
} from "../index.js";

import debug from "debug";
import { ResolvedType } from "./types.js";
import { lookupFailed } from "./errors.js";
import { Nothing } from "purify-ts";
import { lookupQualifiedType } from "../selectors/symbols.js";
import {
  getDefinitionNode,
  getLibraryNode,
  getModuleNode,
} from "../selectors/nodes.js";

const resolutionLog = debug("semantics:type_resolution");

export type InflightLookups = Array<{ typename: string; context: Definition }>;

/**
 * This resolves the type of the named type.  This type normally comes from an
 * instance of `QualifiedType`, but since this function does not account for
 * any modifications, only type name is required and taking the
 * `QualifiedType` might give the impression that this function also process
 * the associated modifications...which it does not.  Therefore any
 * modification handling needs to be done by the caller..
 *
 * @param typename Typename (normally from an instance of `QualifiedType`)
 * @param context Context in which to resolve the name
 * @returns Outcome of type resolution
 */
export function resolveType(
  typename: Token[],
  context: Definition,
  inflight: InflightLookups
): Selector<Result<ResolvedType>> {
  return ({ query }) => {
    const tokenKey = context.source;

    const fqn = typename.map((v) => v.value).join(".");
    if (
      inflight.some((pair) => pair.typename === fqn && context === pair.context)
    ) {
      const key = context.source;
      const span = boundingSpan(typename.map((x) => x.span));
      const history = inflight.map(
        (x) =>
          `Looking up ${x.typename} in ${describeEntity(query(getDefinitionEntity(x.context)))}`
      );
      history.push(
        `Looking up ${fqn} in ${describeEntity(query(getDefinitionEntity(context)))}`
      );
      return failedResult(
        new InfiniteTypeRecursion(
          fqn,
          `Type ${fqn} depends recursively on itself:\n${history.join("\n")}`,
          {
            file: key,
            span,
          }
        )
      );
    }
    return resolveQualifiedName(typename, tokenKey, context, query, [
      ...inflight,
      { typename: fqn, context },
    ]);
  };
}

/**
 * Resolve a potentially fully qualified name in a given context.  This
 * handles the two possible contingencies.  Either the `QualifiedType` is a
 * local type (single string) in which case we call `lazilyResolveLocalType`) or
 * it is fully qualified in which case we traverse from global scope to the
 * named type).
 */
export function resolveQualifiedName(
  qname: Token[],
  tokenKey: Nullable<SourceKey>,
  context: Definition,
  query: QueryHandler,
  inflight: InflightLookups
): Result<ResolvedType> {
  // Is this a simple one token type name?  If so, resolve locally in context
  if (qname.length === 1) {
    resolutionLog(
      "Resolving %s at [%j] as a simple type in context %j",
      qname[0].value,
      qname[0].span,
      context
    );
    return lazilyResolveLocalType(qname[0], context, query, inflight);
  }

  // Otherwise, let's work out the fully qualified name and go look for it
  // at the fully qualified location.
  const libname = qname[0].value;
  const module = qname.slice(1, -1).map((x) => x.value);
  const typename = qname.at(-1);
  const fqn = qname.map((x) => x.value).join(".");
  resolutionLog(
    "Resolving %s at [%j] as a fully qualified type in context %j",
    fqn,
    qname[0].span,
    context
  );
  /* istanbul ignore next */
  if (typename === undefined) {
    throw new CompilerAssertionError(
      "resolveQualifiedName",
      `Expected ${fqn} to have at least one part but it didn't`
    );
  }
  const selector = queryType(libname, module, typename.value);
  const result = query(selector);
  return result.caseOf({
    Nothing: (): Result<ResolvedType> =>
      failedResult(
        lookupFailed(
          typename.value,
          `Unable to resolve type ${typename.value}`,
          {
            file: tokenKey,
            span: typename.span,
          }
        )
      ),
    Just: (v) => {
      const ret = resolveDefinition(v, query, inflight);
      return ret;
    },
  });
}

/**
 * This function resolves a given local type name in the specified context.  The
 * assumption here is that the context **must be within a ParsedFile node**.
 * This function handles traversing all the enclosing scopes.
 *
 * The lookup rules are as follows.
 *
 * 1. Look among built-ins (these are invariant)
 * 2. Look among symbols imported by using (global)
 * 3. Look among all definitions in the current module (synthetic)
 * 4. Look in the Dyad module scope (synthetic)
 *
 * @param typename name of the type to resolve
 * @param context ASTNode where the name appears
 * @param cache WeakMap to search for and/or store cached results
 * @returns Resolution state
 */
export function lazilyResolveLocalType(
  typename: Token,
  context: Definition,
  query: QueryHandler,
  inflight: InflightLookups
): Result<ResolvedType> {
  // Determine the entity (if any) that this type name refers to
  const entity = query(lookupQualifiedType([typename], context));

  // Now convert that entity into a ResolvedType
  return entity.chain((e) => {
    if (isBuiltinEntity(e)) {
      const { name } = unparseBuiltinEntity(e);
      for (let i = 0; i < builtinTypes.length; i++) {
        const bt = builtinTypes[i];
        if (bt.name[0].value === name) {
          return successfulResult(resolvedScalar(bt, Nothing, null, {}));
        }
      }
      return failedResult(
        unknownType(
          name,
          `Unknown builtin type ${name}`,
          problemSpan(context, typename.span)
        )
      );
    } else {
      /**
       * If we get here, the entity this resolved to is a definition so check to
       * see if that definition exists.
       */
      const def = query(getDefinitionNode(e));
      if (def.hasValue()) {
        return resolveDefinition(def.value, query, inflight);
      }
      const { library, modules } = unparseDefinitionEntity(e);
      const lib = query(getLibraryNode(libraryEntity(library)));
      const lprobs = lib.problems();
      if (lprobs.length > 0) {
        return failedResult(
          unknownType(
            e,
            `Type ${typename.value} is being imported from non-existent library ${library} (perhaps add it as a dependency in your Project.toml file and re-instantiate your environment)`,
            problemSpan(context, typename.span)
          )
        );
      }
      const mod = query(getModuleNode(moduleEntity(library, modules)));
      const mprobs = mod.problems();
      if (mprobs.length > 0) {
        if (modules.length === 0) {
          return failedResult(
            unknownType(
              e,
              `Type ${typename.value} doesn't exist in the root module of library ${library}`,
              problemSpan(context, typename.span)
            )
          );
        }
        return failedResult(
          unknownType(
            e,
            `Type ${typename.value} is being imported from non-existent module ${modules.join(".")} in library ${library} (perhaps you have a typo in the name of the module?)`,
            problemSpan(context, typename.span)
          )
        );
      }
      return failedResult(
        unknownType(
          e,
          `Unknown type ${typename.value}`,
          problemSpan(context, typename.span)
        )
      );
    }
  });
}
