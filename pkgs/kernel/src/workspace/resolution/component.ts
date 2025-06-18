import {
  assertUnreachable,
  partialResult,
  Problem,
  Result,
} from "@juliacomputing/dyad-common";
import { Selector } from "../selector.js";
import {
  ComponentDefinition,
  compRef,
  CompRef,
  Declaration,
  deref,
  FileLevelNode,
  ContinuitySet as ContinuityRelation,
  Token,
  createToken,
  ProblemSpan,
  Connection,
} from "@juliacomputing/dyad-ast";
import {
  componentInstanceType,
  ComponentInstanceType,
  isComponentInstanceType,
} from "../newtypes/component.js";
import { resolveQualifiedType } from "./qualified.js";
import { problemSpan } from "../utils.js";
import { DefinitionEntity } from "../entities/definitions.js";
import { checkForExisting, resolveDeclarationType } from "./decl.js";
import { getDefinitionEntity } from "../selectors/entities.js";
import { CompilerAssertionError, UnimplementedError } from "../errors.js";
import { continuitySet, ContinuitySet } from "../newtypes/continuity.js";
import { DisjointSets } from "../../instantiate/disjoint.js";
import { unparseExpression } from "@juliacomputing/dyad-parser";
import {
  ConnectorInstanceType,
  isCompoundConnectorInstanceType,
  isConnectorInstanceType,
} from "../newtypes/connectors.js";
import { Just } from "purify-ts";
import { invalidConnectionSet, unknownConnector } from "./errors.js";
import { ConnectorElement } from "../newtypes/declaration.js";

/**
 * Given a `ComponentDefinition`, construct the type for that component.
 *
 * @param node
 * @returns
 */
export function resolveComponentType(
  node: ComponentDefinition
): Selector<Result<ComponentInstanceType>> {
  return ({ query }) => {
    const problems: Problem[] = [];
    /** Resolve types for everything this extends from */
    const bases = Result.all(
      node.extends.map((base) =>
        query(
          resolveQualifiedType(
            base,
            node,
            isComponentInstanceType,
            "a component definition"
          )
        )
      )
    );
    /** Merge all extended types together into an initial return value */
    const origin = query(getDefinitionEntity(node));
    const ret = bases.chain((b) => mergeExtendTypes(b, node, origin));

    if (ret.hasValue()) {
      const categories = [
        ret.value.connectors,
        ret.value.components,
        ret.value.parameters,
      ];

      // Add local content
      for (const [name, decl] of Object.entries(node.declarations)) {
        // Check if an entity with this name already exists...
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
        /** Extract the element of the component */
        const elem = query(resolveDeclarationType(decl, node, origin));

        /** Incorporate the type of that element into the return value */
        elem.ifResult((v) => {
          switch (v.elem) {
            case "component": {
              ret.value.components.set(name, v);
              break;
            }
            case "connector": {
              ret.value.connectors.set(name, v);
              break;
            }
            case "variable": {
              if (v.variability === "parameter") {
                ret.value.parameters.set(name, v);
              }
            }
          }
        }, problems);
      }

      /** Compute the continuity sets and add those */
      query(computeContinuitySets(node, ret.value, bases)).ifResult((v) => {
        ret.value.continuitySets = v;
      }, problems);
    }
    // Return the result
    return ret.add(...problems);
  };
}

/**
 * Compute the continuity sets for this component (if any)
 *
 * @param node The component definition we are building a type representation for
 * @param base The type representation with everything *but* the continuity sets
 * @param bases The component definitions this extends from
 * @returns
 */
function computeContinuitySets(
  node: ComponentDefinition,
  base: ComponentInstanceType,
  bases: Result<ComponentInstanceType[]>
): Selector<Result<Array<ContinuitySet>>> {
  return ({ query }) => {
    /** A place to capture any problems we run into  */
    const problems: Problem[] = [];

    /** We start by creating the disjoint sets for this specific component */
    const ds = new DisjointSets<CompRef>(
      [],
      (x, y) => unparseExpression(x) === unparseExpression(y)
    );

    /** Merge in the connection sets of all extended classes */
    mergeBaseSets(bases, ds, problems);

    // Iterate over all declarations
    for (const decl of Object.values(node.declarations)) {
      // If this is a path variable, add it as a master node
      if (decl.kind === "var" && decl.variability === "path") {
        // Add path as a master node
        addMasterNode(decl, ds, problems);
      }

      // If it is a component, then we need to first resolve the type of the
      // declaration and then we check whether it is a component or a connector
      // and then process it accordingly.
      if (decl.kind === "cdecl") {
        const elem = query(
          resolveQualifiedType(
            decl.instance,
            node,
            (x) => isComponentInstanceType(x) || isConnectorInstanceType(x),
            "a component type"
          )
        );

        // Note any problems trying to resolve this declaration
        problems.push(...elem.problems());

        // If this resolves to a component, then we merge in the locals of that
        // component as nesteds in our set.
        processComponent(decl, elem, ds);

        // If this is a connector then add any path variables on it
        // as a local for our set.
        processConnector(decl, elem, ds);
      }
    }

    for (const rel of node.relations) {
      if (rel.kind === "cont") {
        processContinuityRelation(ds, rel, node, base, problems);
      }
      if (rel.kind === "cxn") {
        processConnectionRelation(ds, rel, node, base, problems);
      }
    }

    // Now translate the disjoint sets into continuity sets
    return partialResult(
      collectContinuitySets(ds, problems, node),
      ...problems
    );
  };
}

/**
 * This function identifies all path variables in a given connector
 * and builds an array of them to return
 *
 * @param con
 * @param conref
 * @param node
 * @param problems
 * @param span
 * @returns
 */
function addAllPathVaraiblesOnConnector(
  con: ConnectorElement,
  conref: CompRef,
  node: ComponentDefinition,
  problems: Problem[],
  span: ProblemSpan
): CompRef[] {
  const id = unparseExpression(conref);
  const invalid = (kind: string) =>
    invalidConnectionSet(
      id,
      `Component ${id} in ${node.name.value} is ${kind}.  Continuity doesn't currently support a component if it is ${kind}.`,
      span
    );

  switch (con.type.resolves) {
    case "array": {
      problems.push(invalid("an array"));
      return [];
    }
    case "cond": {
      problems.push(invalid("conditional"));
      return [];
    }
    case "scon": {
      problems.push(invalid("a scalar connector"));
      return [];
    }
    case "ccon": {
      const paths = [...con.type.fields.entries()].filter(
        ([_, v]) => v.qualifier === "path"
      );
      const pathFields = paths.map(([k, _]) =>
        appendReference(conref, createToken(k, null))
      );
      return pathFields;
    }
    default:
      assertUnreachable(con.type);
  }
}

/**
 * Process a continuity statement
 *
 * For each continuity statement we assume (now, for simplicity)
 * that every reference is to a path variable **not** a connector.
 * The we populate the disjoint set with all the path variables
 * we find.
 *
 **/
function processContinuityRelation(
  ds: DisjointSets<CompRef>,
  rel: ContinuityRelation,
  node: ComponentDefinition,
  base: ComponentInstanceType,
  problems: Problem[]
) {
  /** Identify any complex references */
  const complex = rel.variables.filter(complexComponentReference);

  /** If anything is a complex reference, add a problem and return */
  if (complex.length > 0) {
    problems.push(
      invalidConnectionSet(
        node.name.value,
        `Invalid connectors found in ${node.name.value}: ${complex
          .map(unparseExpression)
          .join(", ")}`,
        problemSpan(node, rel.span)
      )
    );
    return;
  }

  /** Assume, for now, everything is fine */
  let valid = true;

  /** Loop over all variables referenced by the continuity relation */
  for (const v of rel.variables) {
    /** We know that they are either length of 1 or length of 2 */
    if (v.elems.length === 1) {
      const id = unparseExpression(v);

      /** If it is length of 1, it must be a local path variable */
      const param = base.parameters.get(v.elems[0].name);
      if (param === undefined) {
        problems.push(
          invalidConnectionSet(
            id,
            `No path variable named ${id} in ${node.name.value}`,
            problemSpan(node, rel.span)
          )
        );
        valid = false;
        continue;
      }
      if (param.variability !== "path") {
        problems.push(
          invalidConnectionSet(
            id,
            `Variable named ${id} exists in ${node.name.value} but isn't a path variable`,
            problemSpan(node, rel.span)
          )
        );
        valid = false;
      }
      /** If we get here, it is a path variable so this is valid...so far */
      continue;
    }

    /** If it is length of 2, it must be a reference to a path field on a compound connector */
    const con = base.connectors.get(v.elems[0].name);

    /** Ensure the connector part exists */
    if (con === undefined) {
      const id = unparseExpression(v);
      problems.push(
        unknownConnector(
          id,
          `Unrecognized connector ${id} in ${node.name.value}`,
          problemSpan(node, rel.span)
        )
      );
      valid = false;
      continue;
    }

    const invalid = (kind: string) => {
      const id = v.elems[0].name;
      return invalidConnectionSet(
        id,
        `Component ${id} in ${node.name.value} is ${kind}.  Continuity doesn't currently support a component if it is ${kind}.`,
        problemSpan(node, rel.span)
      );
    };

    /**
     * If we get here, we have the connector.  But let's make sure it isn't an
     * array of conditional or a scalar connector.
     */
    switch (con.type.resolves) {
      case "array": {
        problems.push(invalid("an array"));
        valid = false;
        break;
      }
      case "cond": {
        problems.push(invalid("conditional"));
        valid = false;
        break;
      }
      case "scon": {
        problems.push(invalid("a scalar connector"));
        valid = false;
        break;
      }
      case "ccon": {
        const field = con.type.fields.get(v.elems[1].name);
        if (field === undefined) {
          valid = false;
        }
        break;
      }
      default:
        assertUnreachable(con.type);
    }
  }
  // If we get here and valid is true, then we have a valid set of connectors.
  if (valid) {
    ds.multiJoin(...rel.variables);
  }
}

/**
 * This function processes a connection relation and makes the necessary updates
 * to the disjoint set for all path variables found in the connectors in those
 * connections.
 *
 * @param ds
 * @param rel
 * @param node
 * @param base
 * @param problems
 * @returns
 */
function processConnectionRelation(
  ds: DisjointSets<CompRef>,
  rel: Connection,
  node: ComponentDefinition,
  base: ComponentInstanceType,
  problems: Problem[]
) {
  // Identify any complex connectors
  const complex = rel.connectors.filter(complexComponentReference);
  if (complex.length > 0) {
    problems.push(
      invalidConnectionSet(
        node.name.value,
        `Invalid connectors found in ${node.name.value}: ${complex
          .map(unparseExpression)
          .join(", ")}`,
        problemSpan(node, rel.span)
      )
    );
    return;
  }
  const refs: CompRef[] = [];

  /** Loop over the connectors reference in the connection relation */
  for (const v of rel.connectors) {
    if (v.elems.length === 1) {
      const con = base.connectors.get(v.elems[0].name);
      if (con === undefined) {
        const id = unparseExpression(v);
        problems.push(
          unknownConnector(
            id,
            `Unrecognized connector ${id} in ${node.name.value}`,
            problemSpan(node, rel.span)
          )
        );
      } else {
        refs.push(
          ...addAllPathVaraiblesOnConnector(
            con,
            v,
            node,
            problems,
            problemSpan(node, rel.span)
          )
        );
      }
    }

    /**
     * If we get here, the reference has two parts.  The first part needs to
     * reference a component and the second part needs to reference a connector
     * in that component and any `path` fields in that connector need to go into
     * `refs`
     */
    const comp = base.components.get(v.elems[0].name);
    if (comp === undefined) {
      const id = unparseExpression(v);
      problems.push(
        unknownConnector(
          id,
          `Unrecognized component ${id} in ${node.name.value}`,
          problemSpan(node, rel.span)
        )
      );
      continue;
    } else {
      /**
       * If we get here, we found the child component.  Now we need to check
       * that it has the expected connector.  Make sure it isn't an array
       * or conditional.
       */

      const invalid = (kind: string) => {
        const id = v.elems[0].name;
        return invalidConnectionSet(
          id,
          `Component ${id} in ${node.name.value} is ${kind}.  Continuity doesn't currently support a component if it is ${kind}.`,
          problemSpan(node, rel.span)
        );
      };

      switch (comp.type.resolves) {
        case "comp": {
          /** The component is a normal component, so let's find the connector */
          const id = unparseExpression(v);
          const con = comp.type.connectors.get(v.elems[1].name);
          if (con === undefined) {
            /** Connector wasn't found, report and continue */
            problems.push(
              unknownConnector(
                id,
                `Unrecognized connector ${id} in ${node.name.value}`,
                problemSpan(node, rel.span)
              )
            );
          } else {
            /** If we get here, we found the connector! */
            refs.push(
              ...addAllPathVaraiblesOnConnector(
                con,
                v,
                node,
                problems,
                problemSpan(node, rel.span)
              )
            );
          }
        }
        case "array": {
          problems.push(invalid("an array"));
          break;
        }
        case "cond": {
          problems.push(invalid("conditional"));
          break;
        }
        default:
          assertUnreachable(comp.type);
      }
    }
  }
  ds.multiJoin(...refs);
}

/**
 * This checks that the reference is has only one or two parts
 * and that neither has any indices.
 *
 * @param v
 * @returns
 */
function complexComponentReference(v: CompRef): boolean {
  // We don't support connector references except `con` or `con.field`
  if (v.elems.length !== 1 && v.elems.length !== 2) {
    // If it doesn't have either 1 or 2 elements, it is invalid.
    return true;
  }
  // If it has 1 or 2 elements but any of those have indices, it is invalid
  return v.elems.some((e) => e.indices.length !== 0);
}

function collectContinuitySets(
  ds: DisjointSets<CompRef>,
  problems: Problem[],
  context: FileLevelNode
): ContinuitySet[] {
  const ret: ContinuitySet[] = [];

  for (const set of ds.getSets()) {
    const cset = continuitySet();
    for (const ref of set) {
      // If this has a length of one, it is a potential master.  So we need
      // to check if there already is a master.
      switch (ref.elems.length) {
        case 1: {
          const head = ref.elems[0];
          cset.master.caseOf({
            // If there is no master, then this is the master.
            Nothing: () => {
              cset.master = Just(ref);
            },
            // If there is a master, we have a problem
            Just: (v) => {
              const cur = unparseExpression(v);
              const id = unparseExpression(ref);
              problems.push(
                invalidConnectionSet(
                  id,
                  `Path variables ${id} and ${cur} are in the same path, only one is allowed`,
                  problemSpan(context, head.span)
                )
              );
            },
          });
          break;
        }
        case 2: {
          cset.local.push(ref);
          break;
        }
        case 3: {
          cset.nested.push(ref);
          break;
        }
        default: {
          throw new CompilerAssertionError(
            "collectContinuitySets",
            `collectContinuitySet found a reference of length ${
              ref.elems.length
            }: '${unparseExpression(ref)}'`
          );
        }
      }
    }
    if (cset.master.isJust() && cset.local.length > 0) {
      const master = cset.master.unsafeCoerce();
      problems.push(
        invalidConnectionSet(
          unparseExpression(master),
          `Path variable ${unparseExpression(
            master
          )} is tied to path variables on connectors, this is not allowed`,
          problemSpan(context, master.elems[0].span)
        )
      );
    } else if (cset.master.isNothing() && cset.local.length === 0) {
      throw new CompilerAssertionError(
        "collectContinuitySets",
        `collectContinuitySet found a continuity set with no master or locals`
      );
    } else {
      ret.push(cset);
    }
  }

  return ret;
}

/**
 * This checks if the declaration resolved to a component and, if so, merge in
 * the locals for the component.
 *
 * @param decl
 * @param elem
 * @param ds
 * @returns
 */
function processComponent(
  decl: Declaration,
  elem: Result<ComponentInstanceType | ConnectorInstanceType>,
  ds: DisjointSets<CompRef>
) {
  // If we don't have a value or the value we have ins't a compound connector
  // then we do nothing
  if (!elem.hasValue() || !isComponentInstanceType(elem.value)) {
    return;
  }
  for (const set of elem.value.continuitySets) {
    /**
     * NB - this assumes that each connection set either has a master OR has
     * locals.  It cannot have both.  We don't care about the nested values here
     * because all we need to know is that the locals on this sub-component are
     * all in the same connection set.
     */
    ds.multiJoin(...set.local.map((x) => prependReference(decl.name, x)));
  }
}

/**
 * This checks if the declaration is a connector and, if so, merge in the path
 * variables on those connectors.
 *
 * @param decl
 * @param elem
 * @param ds
 * @returns
 */
function processConnector(
  decl: Declaration,
  elem: Result<ComponentInstanceType | ConnectorInstanceType>,
  ds: DisjointSets<CompRef>
) {
  // If we don't have a value or the value we have ins't a compound connector
  // then we do nothing
  if (!elem.hasValue() || !isCompoundConnectorInstanceType(elem.value)) {
    return;
  }
  const connector = elem.value;
  for (const [fieldName, field] of connector.fields.entries()) {
    if (field.qualifier === "path") {
      // Add potential locals
      ds.add(
        compRef([
          deref(decl.name.value, [], decl.span),
          deref(fieldName, [], null),
        ])
      );
    }
  }
}

/**
 * Add a given path variable declaration as a master node in the disjoint sets.
 *
 * @param decl
 * @param ds
 * @param problems
 */
function addMasterNode(
  decl: Declaration,
  ds: DisjointSets<CompRef>,
  problems: Problem[]
) {
  // Add all declared `path` variables in this component definition
  if (decl.dims.length > 0) {
    problems.push(
      new UnimplementedError(
        "computeContinuitySets",
        "computeContinuitySets not implemented for arrays of path variables"
      )
    );
  } else {
    // Add potential master node
    ds.add(compRef([deref(decl.name.value, [], decl.span)]));
  }
}

/**
 * This function merges the continuity sets of all extended classes into the
 * disjoint sets.
 *
 * @param bases
 * @param ds
 * @param problems
 */
function mergeBaseSets(
  bases: Result<ComponentInstanceType[]>,
  ds: DisjointSets<CompRef>,
  problems: Problem[]
) {
  // Merge in the connection sets of all extended classes
  bases.ifResult((bases) => {
    for (const base of bases) {
      for (const set of base.continuitySets) {
        const refs = [
          ...set.local,
          ...set.nested,
          ...set.master.mapOrDefault((x) => [x], []),
        ];
        ds.multiJoin(...refs);
      }
    }
  }, problems);
}

/**
 * This just prepends a non-array dereference to the front of a component reference.
 *
 * @param name
 * @param ref
 * @returns
 */
function prependReference(name: Token, ref: CompRef): CompRef {
  const initialDeref = deref(name.value, [], name.span);
  return compRef([initialDeref, ...ref.elems]);
}

/**
 * This just appends a non-array dereference to the end of a component reference.
 *
 * @param name
 * @param ref
 * @returns
 */
function appendReference(ref: CompRef, name: Token): CompRef {
  const finalDeref = deref(name.value, [], name.span);
  return compRef([...ref.elems, finalDeref]);
}

/**
 * This function takes a collection of types representing all the
 * component definitions to be extended from and creates a new
 * component instance type that represents the merge of all these
 * types.
 *
 * @param bases
 * @param def
 * @returns
 */
function mergeExtendTypes(
  bases: ComponentInstanceType[],
  def: ComponentDefinition,
  origin: DefinitionEntity
): Result<ComponentInstanceType> {
  const problems: Problem[] = [];
  const ret = componentInstanceType(origin);

  for (let i = 0; i < bases.length; i++) {
    const base = bases[i];
    const span = problemSpan(def, def.extends[i].span);
    const exists = (name: string) =>
      checkForExisting(
        name,
        [ret.connectors, ret.components, ret.parameters],
        def,
        problems,
        span
      );

    for (const [name, connector] of base.connectors) {
      if (exists(name)) {
        continue;
      }
      ret.connectors.set(name, connector);
    }
    for (const [name, parameter] of base.parameters) {
      if (exists(name)) {
        continue;
      }
      ret.parameters.set(name, parameter);
    }
    for (const [name, component] of base.components) {
      if (exists(name)) {
        continue;
      }
      ret.components.set(name, component);
    }
  }
  return partialResult(ret, ...problems);
}
