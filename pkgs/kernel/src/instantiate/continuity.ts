import {
  compRef,
  CompRef,
  ContinuitySet,
  deref,
  expressionSpan,
  ProblemSpan,
} from "@juliacomputing/dyad-ast";
import { ModelInstance } from "./model.js";
import {
  FailedResult,
  failedResult,
  partialResult,
  PartialResult,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import {
  invalidConnection,
  invalidContinuitySet,
  undeclaredSymbol,
} from "./errors.js";
import { unparseExpression } from "@juliacomputing/dyad-parser";
import { walkInstance } from "./walk.js";
import { problemSpan } from "../workspace/utils.js";
import { ResolvedType } from "../workspace/types/types.js";
import { DisjointSets } from "./disjoint.js";
import { CompilerAssertionError } from "../workspace/errors.js";

import debug from "debug";
import { ComponentInstance } from "./component.js";
import { QueryHandler } from "../workspace/selector.js";
import { isConnectionInstance } from "./connection.js";
import { InstanceContext } from "./context.js";

const pathLog = debug("inst:path");

export interface ContintuitySetRelationInstance
  extends ContinuitySet,
    InstanceContext {}

export function instantiateContinuitySetRelation(
  rel: ContinuitySet,
  ictxt: InstanceContext
): Result<ContintuitySetRelationInstance> {
  return successfulResult({ ...rel, ...ictxt });
}

export interface ContinuitySetInstance {
  type: ResolvedType;
  /**
   * The identity of the local `path` variable that these are bound to.
   * Otherwise, we'll need to create a "virtual" path variable during code
   * generation.
   */
  master: Maybe<CompRef>;
  /**
   * All connectors of this component instance that have path fields that are
   * in this set.
   */
  local: Array<CompRef>;
  /**
   * All connectors of sub-components of this component instance that have
   * path fields in this set.
   */
  nested: Array<CompRef>;
}

/**
 * To support path variables, we must formulate the continuity
 * sets associated with a given component.  The continuity sets
 * are (potentially) disjoint sets of variables that all belong
 * to the same path.  These disjoint sets are used in a similar
 * fashion to those used with Kruskal's algorithm (to maintain)
 * sets of unconnected graphs.  Ultimately, these graphs are
 * connected via either `connect` or `continuity` statements
 * (the former being a stronger form of the latter).
 *
 * @param workspace Workspace the components are defined in
 * @param instance Instance of a component
 * @returns The continuity set for this component
 */
export function buildContinuitySets(
  query: QueryHandler,
  instance: ModelInstance
): Result<ContinuitySetInstance[]> {
  const def = query(instance.def);

  // Construct the span to use in any errors we encounter.
  const defspan = problemSpan(def, def.span);

  // TODO: This comparator could be made more efficient
  const ds = new DisjointSets<CompRef>(
    [],
    (x, y) => unparseExpression(x) === unparseExpression(y)
  );

  // Add all local `path` variables
  for (const cvname of Object.keys(instance.pathVariables)) {
    pathLog(
      "%s: Adding local variable '%s' to continuity sets",
      def.name.value,
      cvname
    );
    ds.add(compRef([deref(cvname, [], null)]));
  }

  // Add all path variables on **this** models connectors
  for (const [conname, con] of Object.entries(instance.connectors)) {
    // If this is a structured connector
    if (con.def.kind === "strcon") {
      // ...iterate over all fields...
      for (const [ename, elem] of Object.entries(con.def.elements)) {
        // ...and if we find a path variable
        if (elem.qualifier === "path") {
          const ref = compRef([
            deref(conname, [], null),
            deref(ename, [], null),
          ]);
          pathLog(
            "%s: Adding field '%s' from local connector",
            def.name.value,
            unparseExpression(ref)
          );
          // Add it to the disjoint set
          ds.add(ref);
        }
      }
    }
  }

  // Add all path variables on sub-component's connectors.  We start by
  // iterating over the sub-components
  for (const [compname, comp] of Object.entries(instance.components)) {
    let compr = comp();
    if (!compr.hasValue()) {
      continue;
    }
    // This hack won't be necessary once `hasValue` is a type predicate (PR pending)
    const val = (compr as any as PartialResult<ComponentInstance>).value;
    // ...querying **their** continuity graph...
    for (const cs of val.instance.continuityGraph) {
      // Check if this sub-component defines a "root" for this particular
      // continuity graph **and** the same graph has connections to external
      // components, then this is an error (because the domain of dependence
      // would escape the hierarchy of the sub-component).
      if (cs.master.isJust() && cs.local.length > 0) {
        return failedResult(
          invalidContinuitySet(
            compname,
            `Component ${compname} in ${
              def.name.value
            } has external connectors AND specifies an internal value for common variables via ${unparseExpression(
              cs.master.unsafeCoerce()
            )}, this is not allowed`,
            defspan
          )
        );
      }
      // ...and adding any local elements in that set to our set.  This let's
      // us know not only what `path` variables are present in the sub-component
      // but whether or not any of them are connected to each other.
      for (const conref of cs.local) {
        const ref = compRef([deref(compname, [], null), ...conref.elems]);
        pathLog(
          "%s: Adding connector '%s' from subcomponent",
          def.name.value,
          unparseExpression(ref)
        );
        ds.add(ref);
      }
    }
  }

  // Now iterate over the continuity statements (which define additional
  // edges in the continuity graph) and use these to (potentially) join
  // the disjoint sets.
  for (const cs of instance.continuityStatements) {
    pathLog(
      "%s: Current disjoint sets: %s",
      def.name.value,
      ds.stringify(unparseExpression)
    );
    pathLog(
      "%s: Common statements bind the following variables together: %j",
      def.name.value,
      cs.variables.map(unparseExpression)
    );
    // Iterate over the variables referenced in the continuity statement...
    for (const v of cs.variables) {
      // ...to ensure that the variables themselves are already present (otherwise
      // we are adding an edge to a previously unknown vertex in the graph).
      if (!ds.has(v)) {
        const n = unparseExpression(v);
        const span = expressionSpan(v);
        return failedResult(
          undeclaredSymbol(
            unparseExpression(v),
            `Expected path variable ${n} referenced in continuity statement in ${
              def.name.value
            } to be present in the set of path variables associated with this component (${ds.stringify(
              unparseExpression
            )})`,
            problemSpan(def, span)
          )
        );
      }
    }
    // If we get here, all variables have vertices associated with them
    // in the continuity graph so we can join any disjoint sets that
    // reference the variables in the continuity statement.
    ds.multiJoin(...cs.variables);
  }

  // Now we do the same thing with connect statements.
  // NB - a `connect` statement also implies continuity (in addition
  // to other mathematical properties that we are not concerned with
  // here).
  const connections = instance.relations.filter(isConnectionInstance);
  for (const cxn of connections) {
    if (cxn.type.resolves === "strcon") {
      for (const [ename, elem] of Object.entries(cxn.type.def.elements)) {
        if (elem.qualifier === "path") {
          const refs = cxn.connectors.map((ref) =>
            compRef([...ref.elems, deref(ename, [], null)])
          );
          pathLog(
            "%s: Current disjoint sets: %s",
            def.name.value,
            ds.stringify(unparseExpression)
          );
          pathLog(
            "%s: Connect statement binds the following variables together: %j",
            def.name.value,
            refs.map(unparseExpression)
          );
          for (const v of refs) {
            if (!ds.has(v)) {
              const n = unparseExpression(v);
              const span = expressionSpan(v);
              return failedResult(
                invalidConnection(
                  unparseExpression(v),
                  `Expected path variable ${n} referenced in connect statement in ${
                    def.name.value
                  } to be present in the set of path variables associated with this component (${ds.stringify(
                    unparseExpression
                  )})`,
                  problemSpan(def, span)
                )
              );
            }
          }
          ds.multiJoin(...refs);
        }
      }
    }
  }

  const problems: Problem[] = [];
  // Join using common sets from subcomponents
  for (const [compname, comp] of Object.entries(instance.components)) {
    comp().ifResult((c) => {
      const compi = c.instance;
      pathLog(
        "%s: Common set from component %s is %s",
        def.name.value,
        compname,
        stringifyContinuitySets(compi.continuityGraph)
      );

      for (const cs of compi.continuityGraph) {
        const transformedRefs = cs.local.map((conref) =>
          compRef([deref(compname, [], null), ...conref.elems])
        );
        pathLog(
          "%s: Current disjoint sets: %s",
          def.name.value,
          ds.stringify(unparseExpression)
        );

        pathLog(
          "%s: Common set from %s binds the following variables together: %j",
          def.name.value,
          compname,
          transformedRefs.map(unparseExpression)
        );
        for (const v of transformedRefs) {
          if (!ds.has(v)) {
            const n = unparseExpression(v);
            const span = expressionSpan(v);
            return failedResult(
              undeclaredSymbol(
                unparseExpression(v),
                `Expected common path ${n} referenced in common set of component ${compname} in ${
                  def.name.value
                } to be present in the set of path variables associated with this component (${ds.stringify(
                  unparseExpression
                )})`,
                problemSpan(def, span)
              )
            );
          }
        }
        ds.multiJoin(...transformedRefs);
      }
    }, problems);
  }

  const ret: ContinuitySetInstance[] = [];
  for (const s of ds.getSets()) {
    const type = componentTypes(query, instance, s, defspan);
    if (type instanceof FailedResult) {
      return type;
    }
    if (type.hasValue()) {
      const masters = s.filter((r) => r.elems.length === 1);
      const local = s.filter((r) => r.elems.length === 2);
      const nested = s.filter((r) => r.elems.length === 3);

      switch (masters.length) {
        case 0: {
          if (local.length === 0) {
            if (nested.length === 0) {
              throw new CompilerAssertionError(
                def.name.value,
                "Completely empty common set"
              );
            }
            return failedResult(
              invalidContinuitySet(
                def.name.value,
                `In component ${
                  def.name.value
                }, no local specification or external connectors on which to determine value for the following common variables: ${nested
                  .map((r) => unparseExpression(r))
                  .join(", ")}`,
                defspan
              )
            );
          } else {
            ret.push({ type: type.value, master: Nothing, local, nested });
          }
          break;
        }
        case 1: {
          if (local.length > 0) {
            return failedResult(
              invalidContinuitySet(
                def.name.value,
                `In component ${def.name.value}, variables ${nested
                  .map((r) => unparseExpression(r))
                  .join(
                    ", "
                  )} are connected to both a local common variable AND external connectors...this is not allowed`,
                defspan
              )
            );
          } else {
            if (nested.length === 0) {
              throw new CompilerAssertionError(
                def.name.value,
                "Completely empty common set"
              );
            }
            ret.push({
              type: type.value,
              master: Just(masters[0]),
              local,
              nested,
            });
          }
          break;
        }
        default: {
          return failedResult(
            invalidContinuitySet(
              def.name.value,
              `In component ${def.name.value}, there are ${
                masters.length
              } (${masters
                .map((r) => unparseExpression(r))
                .join(", ")}) variables all specifying a single common value`,
              defspan
            )
          );
        }
      }
    }
  }
  pathLog(
    "Final common sets for %s: %s",
    def.name.value,
    stringifyContinuitySets(ret)
  );
  return partialResult(ret, ...problems);
}

export function componentTypes(
  query: QueryHandler,
  instance: ModelInstance,
  refs: CompRef[],
  defspan: ProblemSpan
): Result<ResolvedType> {
  const def = query(instance.def);
  const insts = Result.all(
    refs.map((r) => walkInstance(instance, def, r, query))
  );
  return insts.chain((t) => {
    const base = t[0];
    if (
      (base.kind !== "cvari" && base.kind !== "vari") ||
      (base.type.resolves !== "struct" && base.type.resolves !== "scalar")
    ) {
      return failedResult(
        invalidContinuitySet(
          def.name.value,
          `Common variables (in ${def.name.value}) must (currently) be struct or scalar types`,
          defspan
        )
      );
    }
    for (let i = 1; i < t.length; i++) {
      const alt = t[i];
      if (
        (alt.kind !== "cvari" && alt.kind !== "vari") ||
        (alt.type.resolves !== "struct" && alt.type.resolves !== "scalar")
      ) {
        return failedResult(
          invalidContinuitySet(
            def.name.value,
            `Common variables (in ${def.name.value}) must (currently) be struct or scalar types`,
            defspan
          )
        );
      }
      if (alt.type.resolves === "struct" && base.type.resolves === "struct") {
        if (alt.type.def !== base.type.def) {
          return failedResult(
            invalidContinuitySet(
              def.name.value,
              `Common values are composed of at least two different types, ${base.type.def.name.value} and ${alt.type.def.name.value}`,
              defspan
            )
          );
        }
      } else if (
        alt.type.resolves === "scalar" &&
        base.type.resolves === "scalar"
      ) {
      } else {
        return failedResult(
          new CompilerAssertionError(
            def.name.value,
            `Unexpected case of component types not having expected values (${alt.type.resolves} vs. ${base.type.resolves})`
          )
        );
      }
      // FIXME: Check path of each, not def
    }
    return successfulResult(base.type);
  });
}

export function stringifyContinuitySets(x: ContinuitySetInstance[]): string {
  return JSON.stringify(
    x.map((s) => {
      return {
        master: s.master.mapOrDefault(unparseExpression, "--"),
        local: s.local.map(unparseExpression),
        nested: s.nested.map(unparseExpression),
      };
    })
  );
}
