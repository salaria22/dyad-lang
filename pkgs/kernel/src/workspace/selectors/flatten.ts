/**
 * This file contains a single (public) operator that will flatten the
 * definition of any entity.  It also contains several file local
 * functions/operators that handle various contingencies of this process.
 */

import {
  DefinitionEntity,
  extendsInExternal,
  BuiltinEntity,
  isBuiltinEntity,
  unparseDefinitionEntity,
  describeEntity,
  invalidEntity,
  unknownDefinition,
  unparseBuiltinEntity,
} from "../entities/index.js";
import {
  assertUnreachable,
  failedResult,
  Nullable,
  partialResult,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  builtinTypes,
  componentDefinition,
  ComponentDefinition,
  createToken,
  Definition,
  FileContents,
  isComponentDefinition,
  isParsedFile,
  isScalarTypeDefinition,
  MetadataNode,
  metadataNode,
  ProblemSpan,
  qualifiedName,
  QualifiedType,
  qualifiedType,
  scalarConnectorDefinition,
  ScalarConnectorDefinition,
  scalarTypeDefinition,
  ScalarTypeDefinition,
} from "@juliacomputing/dyad-ast";
import {
  existingElement,
  infiniteRecursion,
} from "../../instantiate/errors.js";
import { CompilerAssertionError, UnimplementedError } from "../errors.js";
import lodash from "lodash";
import {
  getDefinitionEntity,
  problemSpan,
  Selector,
  spanInFile,
} from "../index.js";
import { lookupQualifiedType } from "./symbols.js";
import { getDefinitionNode, getFileNode } from "./nodes.js";
import { getDefinitionRelations } from "./relations.js";

export function flattenDefinitionEntity(
  e: DefinitionEntity | BuiltinEntity,
  history: Set<DefinitionEntity>
): Selector<Result<Definition>> {
  /** If this is a builtin type, then just return an operator that yields the builtin types */
  if (isBuiltinEntity(e)) {
    // Needs to return a Result
    return () => {
      return builtinTypeOperator(e);
    };
  }

  /**
   * Check to ensure that we are not attempting to flatten something that
   * has already been visited and is awaiting resolution of this flattening
   * to complete its own flattening.  If `e` exists in `history, then we have
   * a circular reference.
   */
  if (history.has(e)) {
    return () => {
      return failedResult(
        infiniteRecursion(
          e,
          `Infinite recursion looking up ${
            unparseDefinitionEntity(e).definition
          }: ${[...history].map((e) => describeEntity(e)).join("\n")}`
        )
      );
    };
  }

  /**
   * Otherwise, fetch the semantic node as a definition and then
   * flatten it.
   */
  return ({ query }) => {
    const node = query(getDefinitionNode(e));
    return node
      .map((n) => query(flattenDefinition(n, e, history)))
      .orDefault(failedResult(unknownDefinition(e, describeEntity(e))));
  };
}

/**
 * This function produces an observable that yields flattened representations of
 * the definition `def` (referred to as entity `de`).  This assumes the set of
 * pending types to be flattened is contained in `history` and that if any
 * `WorkspaceOperator`s are to be invoked, then `w` should be piped to them.
 *
 * @param w Observable workspace nodes
 * @param def The definition to flatten
 * @param de The entity that refers to `def`
 * @param history The set of types pending flattening
 * @returns An observable of the flattened version of def
 */
function flattenDefinition(
  def: Definition,
  de: DefinitionEntity,
  history: Set<DefinitionEntity>
): Selector<Result<Definition>> {
  return ({ query }) => {
    switch (def.kind) {
      /**
       * The following definitions do not involve any recursive types so they are already flat
       **/
      case "fun":
      case "strcon":
      case "struct":
      case "enum":
        return successfulResult(def);
      /** Scalar types inherit from another type (which might be builtin) */
      case "scalar":
        return query(flattenScalarType(def, history));
      /** Scalar connectors inherit from another type, much like scalars */
      case "sclcon":
        return query(flattenScalarConnector(def, history));
      /** Analysis definitions must extend from another analysis */
      case "adef":
        return failedResult(
          new UnimplementedError(
            "flattenDefinition",
            "flattenDefinition cannot handle analysis definitions (yet)"
          )
        );
      /** Component definitions have extends clauses */
      case "cdef":
        return query(flattenComponentDefinition(def, de, history));
      default:
        assertUnreachable(def);
    }
  };
}

/**
 * This function flattens scalar types
 *
 * @param def A ScalarTypeDefinition node
 * @param self The entity that refers to `def`
 * @param w Observable workspace nodes
 * @param history The set of types pending flattening
 * @returns An observable of the flattened ScalarTypeDefinition
 */
function flattenScalarType(
  def: ScalarTypeDefinition,
  history: Set<DefinitionEntity>
): Selector<Result<ScalarTypeDefinition>> {
  return ({ query }) =>
    query(
      followTypeAs(
        def.base,
        def,
        isScalarTypeDefinition,
        "scalar type definition",
        history
      )
    ).map((flattenedParent) => {
      return scalarTypeDefinition(
        def.doc_string,
        def.name,
        qualifiedType(
          flattenedParent.base.name,
          { ...(flattenedParent.base.mods ?? {}), ...(def.base.mods ?? {}) },
          def.base.span
        ),
        mergeMetadata(flattenedParent.metadata, def.metadata),
        // These are null because this doesn't actually exist on a filesystem
        null,
        null
      );
    });
}

/**
 * This function flattens scalar types
 *
 * @param def A ScalarTypeDefinition node
 * @param self The entity that refers to `def`
 * @param w Observable workspace nodes
 * @param history The set of types pending flattening
 * @returns An observable of the flattened ScalarTypeDefinition
 */
function flattenScalarConnector(
  def: ScalarConnectorDefinition,
  history: Set<DefinitionEntity>
): Selector<Result<ScalarConnectorDefinition>> {
  return ({ query }) =>
    query(
      followTypeAs(
        def.type,
        def,
        isScalarTypeDefinition,
        "scalar type definition",
        history
      )
    ).map((flattenedParent) =>
      scalarConnectorDefinition(
        def.name,
        def.qualifier,
        qualifiedType(
          flattenedParent.base.name,
          { ...(flattenedParent.base.mods ?? {}), ...(def.type.mods ?? {}) },
          def.type.span
        ),
        def.doc_string,
        mergeMetadata(flattenedParent.metadata, def.metadata),
        // These are null because this doesn't actually exist on a file system
        null,
        null,
        []
      )
    );
}

/**
 * This function flattens a component definition.  In practice, this involves
 * fetching all the components it extends from (in flattened form themselves)
 * and then merging them all together.
 *
 * @param def `ComponentDefinition` to flatten
 * @param self The entity that refers to `def`
 * @param history History information about previously resolved types
 * @returns A flattened `ComponentDefinition`
 */
function flattenComponentDefinition(
  def: ComponentDefinition,
  self: DefinitionEntity,
  history: Set<DefinitionEntity>
): Selector<Result<ComponentDefinition>> {
  return ({ query }) => {
    const nextHistory = new Set(history);
    nextHistory.add(self);
    const bases = query(followBaseClasses(def, nextHistory));
    const node = query(getDefinitionNode(self));
    const rels = node.map((x) => query(getDefinitionRelations(x)));
    const file = rels.chain((v) => query(getFileNode(v.file, isParsedFile)));
    return bases.chain((b) => mergeComponentDefinitions(def, b, file));
  };
}

/**
 * This is a helper function that takes a given `ComponentDefinition`, `def` and
 * flattened versions of all the components it extends from, `bases` and merges
 * them all together.
 *
 * @param def The `ComponentDefinition` to flatten
 * @param bases Flattened versions of all components it extends from
 * @param file Information about the file that `def` is in
 * @returns Flattened version of `def`
 */
function mergeComponentDefinitions(
  def: ComponentDefinition,
  bases: Array<ComponentDefinition>,
  file: Result<FileContents>
): Result<ComponentDefinition> {
  /** Create an initial empty component from the `def` skeleton */
  const ret = componentDefinition(
    def.qualifier,
    def.name,
    [],
    {},
    [],
    def.doc_string,
    metadataNode({}, null),
    // These are null because this doesn't actually exist on a filesystem
    null,
    null
  );

  /**
   * Check to see if this is an external component.  If so, it should
   * not extend from anything.
   */
  if (def.qualifier === "external" && bases.length > 0) {
    if (!file.hasValue()) {
      console.error(
        "Expected file contents associated with definition, found none!"
      );
      throw new CompilerAssertionError(
        def.name.value,
        `No file contents for definitions ${def.name.value}`
      );
    }
    return partialResult(
      ret,
      extendsInExternal(
        def.name.value,
        `External component ${def.name.value} cannot extends other components`,
        spanInFile(file.value, def.extends[0].span)
      )
    );
  }

  /** Use this to collect any problems we encounter. */
  const problems: Problem[] = [];

  /** Add the bases this component extends from, in order */
  for (const base of [...bases, def]) {
    /** Fold in declarations */
    ret.declarations = fold(
      "declaration",
      base.name.value,
      ret.declarations,
      base.declarations,
      problems,
      problemSpan(def, def.span)
    );
    /** Merge metadata */
    ret.metadata = mergeMetadata(ret.metadata, base.metadata);
    /** Add relations */
    for (const ce of base.relations) {
      const eidx = ret.relations.findIndex(
        (e) =>
          e.kind === "eq" &&
          ce.kind === "eq" &&
          e.name !== null &&
          ce.name === e.name
      );
      if (eidx === -1) {
        ret.relations.push(ce);
      } else {
        ret.relations[eidx] = ce;
      }
    }
  }

  /** Return the result along with any problems found */
  return partialResult(ret, ...problems);
}

/**
 * This is a helper function to merge two records together.
 *
 * @param collection Name of the thing being merged (for error message)
 * @param baseName Name of the thing being merged (for error message)
 * @param parent The record to merge
 * @param cur The record to merge _into_
 * @param problems A place to report any problems encountered
 * @returns The merged record
 */
function fold<V>(
  collection: string,
  baseName: string,
  parent: Record<string, V>,
  cur: Record<string, V>,
  problems: Problem[],
  span: ProblemSpan
): Record<string, V> {
  const ret: Record<string, V> = { ...parent };

  for (const [key, val] of Object.entries(cur)) {
    if (Object.hasOwn(parent, key)) {
      problems.push(
        existingElement(
          key,
          `Cannot inherit ${collection} ${key} from ${baseName} because a field with that name was already inherited`,
          span
        )
      );
    } else {
      ret[key] = val;
    }
  }

  return ret;
}

/**
 * This is function allows us to "subscribe" to each component definition that
 * the component definition `def` references.  All of the resulting component
 * definition objects returned are already flattened.
 *
 * @param def Component whose extended component definitions we want to
 * subscribe to
 * @param self The entity corresponding to def
 * @param history A history of lookups to avoid infinite recursion
 * @returns An observable that emits an array of component definitions in the
 * same order as the extends clauses in `def`.
 */
function followBaseClasses(
  def: ComponentDefinition,
  history: Set<DefinitionEntity>
): Selector<Result<ComponentDefinition[]>> {
  return ({ query }) => {
    /**
     * If there are no extends clauses, we need to provide a source that emits
     * an empty array
     **/
    if (def.extends.length === 0) {
      return successfulResult([]);
    }
    /**
     * Map over the components this component extends from and create an
     * Observable for the flattened version of each.
     **/
    const bases = def.extends.map((base) =>
      /** Initiate a new Observer all the way back from the Workspace */
      query(
        followTypeAs(
          base,
          def,
          isComponentDefinition,
          "component definition",
          history
        )
      )
    );
    /**
     * Combine these individual observables into a single observable and then
     * run those through `resultAll` so we ultimately end up with a
     * `Result<ComponentDefinition[]>` and not a
     * `Result<ComponentDefinition>[]`.
     */
    return Result.all(bases);
  };
}

/** A helper function to merge metadata */
function mergeMetadata(
  a: Nullable<MetadataNode>,
  b: Nullable<MetadataNode>
): MetadataNode {
  return metadataNode(lodash.merge({}, a?.value ?? {}, b?.value ?? {}), null);
}

/**
 * This function allows us to query a specified type, `qtype`, in a specified
 * context, `context`.  Furthermore, it assumes that the result will be of the
 * type indicated by the predicate.
 *
 * @param qtype
 * @param context
 * @param pred
 * @param history
 * @returns
 */
function followTypeAs<T extends Definition>(
  qtype: QualifiedType,
  context: Definition,
  pred: (x: Definition) => x is T,
  expected: string,
  history: Set<DefinitionEntity>
): Selector<Result<T>> {
  return ({ query }) => {
    const entity = query(getDefinitionEntity(context));
    const nextHistory = new Set(history);
    // Add this context to the history
    nextHistory.add(entity);

    // Lookup the parent definition
    const parentDefinition = query(lookupQualifiedType(qtype.name, context));

    // Flatten the parent
    const flattenedParent = parentDefinition.chain((p) =>
      query(flattenDefinitionEntity(p, nextHistory))
    );

    return flattenedParent.filter<T>(pred, (v) =>
      invalidEntity(
        entity,
        `Expected ${qualifiedName(qtype)} in ${describeEntity(
          entity
        )} to resolve to a ${expected}`,
        problemSpan(v, qtype.span)
      )
    );
  };
}

/**
 * This is a `Workspace` operator that returns the `Definition` associated
 * with a builtin entity
 * @param e The builtin entity
 * @returns The `Definition` for that entity
 */
function builtinTypeOperator(e: BuiltinEntity): Result<Definition> {
  const { name } = unparseBuiltinEntity(e);
  const base = builtinTypes.find((x) => x.name[0].value === name);
  if (base === undefined) {
    return failedResult(
      new CompilerAssertionError(name, `Unknown builtin type ${name}`)
    );
  }
  // This really should return new style types, not a `Definition`
  return successfulResult(
    scalarTypeDefinition(null, createToken(name, null), base, null, null, null)
  );
}
