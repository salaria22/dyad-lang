import {
  DocString,
  ComponentDefinition,
  isComponentDeclaration,
  isVariableDeclaration,
  ComponentQualifier,
  Modifications,
  MetadataNode,
  Token,
  Expression,
  TextProblem,
  exprCase,
  isParsedFile,
  ParsedFile,
  ComponentDeclaration,
  VariableDeclaration,
  ContinuitySet,
  isComponentDefinition,
  isFileContents,
} from "@juliacomputing/dyad-ast";
import {
  Selector,
  componentType,
  contextualizeProblem,
  DefinitionEntity,
  describeEntity,
  isDefinitionEntity,
  problemSpan,
  ResolvedComponentType,
  QueryHandler,
  resolveType,
  getDefinitionEntity,
  getDefinitionRelations,
} from "../workspace/index.js";
import {
  Nullable,
  Problem,
  assertUnreachable,
  Result,
  partialResult,
} from "@juliacomputing/dyad-common";
import { VariableInstance, instantiateVariable } from "./variable.js";
import { ComponentInstance, instantiateComponent } from "./component.js";
import { filterEntries } from "@juliacomputing/dyad-common";
import {
  instantiateRecordConnector,
  instantiateScalarConnector,
  ConnectorInstance,
} from "./connector.js";
import { mergeInstance } from "./merge.js";
import { extendInstance } from "./extend.js";

import debug from "debug";
import { astLog, instLog } from "./log.js";
import {
  NormalizedDyadDefinition,
  dyadDefinition,
  normalizeDefinition,
  zodIssue2Problem,
  NormalizedDyadDeclaration,
  dyadDeclaration,
  normalizeDeclaration,
} from "../metadata/index.js";
import {
  CompilerAssertionError,
  UnimplementedError,
} from "../workspace/errors.js";
import { unexpectedImplementation } from "./errors.js";
import { unparseMTKExpression } from "../codegen/equation.js";
import { buildContinuitySets, ContinuitySetInstance } from "./continuity.js";
import { walkInstance } from "./walk.js";
import { globalVariables } from "../workspace/symbols/globals.js";
import { computed } from "mobx";
import { EntityCache } from "../workspace/entities/cache.js";
import {
  getDefinitionNode,
  getFileNode,
} from "../workspace/selectors/index.js";
import { instantiateRelation, RelationInstance } from "./relations.js";
import { rootInstanceContext } from "./context.js";

const modelLog = debug("inst:model");

export interface ModelInstance {
  kind: "model";
  /** Any qualifiers that may have applied to the component definition */
  qualifier: Nullable<ComponentQualifier>;
  /** The component definition that this is an instance of */
  def: Selector<ComponentDefinition>;
  /** Type */
  type: ResolvedComponentType;
  /** Any modifications applied to instance (above and beyond the definition) */
  mods: Modifications;
  /** The name if the instance */
  name: Token;
  /** Sets of common variables (this is TYPE information) */
  continuityGraph: Array<ContinuitySetInstance>;
  /** All connectors associated with this instance */
  connectors: Record<string, ConnectorInstance>;
  /** All subcomponents associated with this instance */
  components: Record<string, () => Result<ComponentInstance>>;
  /** All common variables associated with this instance */
  pathVariables: Record<string, VariableInstance>;
  /** All constants associated with this instance */
  constants: Record<string, VariableInstance>;
  /** All structural parameters associated with this instance */
  structural: Record<string, VariableInstance>;
  /** All parameters associated with this instance */
  parameters: Record<string, VariableInstance>;
  /** All variables associated with this instance */
  variables: Record<string, VariableInstance>;
  /** Instantiated relations */
  relations: Array<RelationInstance>;
  /** All common statements (looping, conditional, not currently supported) */
  continuityStatements: Array<ContinuitySet>;
  /** The doc string associated with the instance */
  doc_string: Nullable<DocString>;
  /** Any metadata associated with the definition */
  definition_metadata: NormalizedDyadDefinition;
  /** Any metadata associated with the declaration */
  declaration_metadata: NormalizedDyadDeclaration;
  /** Any keys to be used when expanding string templates (used primarily in label metadata) */
  substitutions: Record<string, string>;
}

const issueMap = zodIssue2Problem("instantiateModel", "definition");

const entityCache = new EntityCache<DefinitionEntity, ModelInstance>(
  _instantiateModel,
  isDefinitionEntity
);

export function instantiateModel(
  model: ComponentDefinition,
  mods: Modifications,
  declaration_metadata: Nullable<MetadataNode>,
  query: QueryHandler
): Result<ModelInstance> {
  astLog("AST for model %s: %j", model.name, model);
  modelLog("Checking for instantiated model %s", model.name.value);

  const e = query(getDefinitionEntity(model));

  /**
   * This closure is what takes the "generic" cached instance
   * and modifies it to include the specified modifications and
   * declaration metadata.
   */
  const patch = (inst: Result<ModelInstance>) => {
    const problems: Problem[] = [];
    // We use passthrough to preserve non-standard metadata
    const validated_declaration_metadata = dyadDeclaration
      .passthrough()
      .safeParse(declaration_metadata ? declaration_metadata.value : {});

    if (!validated_declaration_metadata.success) {
      const problems = validated_declaration_metadata.error.issues.map((x) =>
        issueMap(x, problemSpan(model, declaration_metadata?.span ?? null))
      );
      for (const prob of problems) {
        problems.push(prob);
      }
    }

    const normalizedDeclaration = normalizeDeclaration(
      validated_declaration_metadata.success
        ? validated_declaration_metadata.data
        : {}
    );

    return inst
      .map((r) => ({
        ...r,
        mods: { ...mods },
        declaration_metadata: normalizedDeclaration,
      }))
      .add(...problems);
  };

  return patch(entityCache.get(e, query));
}

function _instantiateModel(
  e: DefinitionEntity,
  query: QueryHandler
): Result<ModelInstance> {
  const iproblems: Array<Problem<unknown>> = [];
  const selector: Selector<ComponentDefinition> = ({ query }) => {
    const def = query(getDefinitionNode(e));
    if (!def.hasValue()) {
      throw new CompilerAssertionError(
        e,
        `Model instance refers to definition ${describeEntity(
          e
        )} which no longer seems to exist`
      );
    }
    if (isComponentDefinition(def.value)) {
      return def.value;
    }
    throw new CompilerAssertionError(
      e,
      `Expected ${describeEntity(
        e
      )} to be a component definition, but it was a ${def.value.kind}`
    );
  };
  const model = query(selector);
  astLog("AST for model %s: %j", model.name, model);
  modelLog("(Re-)Instantiating model %s", model.name.value);

  // We use passthrough to preserve non-standard metadata
  const validated_definition_metadata = dyadDefinition
    .passthrough()
    .safeParse(model.metadata ? model.metadata.value : {});

  if (!validated_definition_metadata.success) {
    const problems = validated_definition_metadata.error.issues.map((x) =>
      issueMap(x, problemSpan(model, model.metadata?.span ?? null))
    );
    for (const prob of problems) {
      iproblems.push(prob);
    }
  }

  const normalizedDefinition = normalizeDefinition(
    validated_definition_metadata.success
      ? validated_definition_metadata.data
      : {}
  );

  const ret: ModelInstance = {
    kind: "model",
    qualifier: model.qualifier,
    def: selector,
    type: componentType(model),
    mods: {},
    name: model.name,
    continuityGraph: [],
    pathVariables: {},
    constants: {},
    structural: {},
    parameters: {},
    connectors: {},
    variables: {},
    components: {},
    relations: [],
    continuityStatements: [],
    doc_string: model.doc_string,
    definition_metadata: normalizedDefinition,
    declaration_metadata: {} as any, // Just a place holder until we can add this
    substitutions: {},
  };

  // First, expand any extends clauses (to establish the base type
  // for components, etc.) and apply modifications.
  for (const extend of model.extends) {
    extendInstance(extend, model, query).ifResult((instance) => {
      return partialResult(
        undefined,
        ...mergeInstance(ret, instance, problemSpan(model, extend.span))
      );
    }, iproblems);
  }

  // Second, elaborate connectors and components
  for (const [cn, c] of filterEntries(
    model.declarations,
    isComponentDeclaration
  )) {
    processComponentDeclaration(model, query, cn, c, iproblems, ret);
  }

  // Third, elaborate variables
  for (const [cn, c] of filterEntries(
    model.declarations,
    isVariableDeclaration
  )) {
    processVariableDeclaration(model, e, query, cn, c, iproblems, ret);
  }

  // Fourth, validate and inject relations
  for (let ri = 0; ri < model.relations.length; ri++) {
    const rel = model.relations[ri];
    instantiateRelation(
      rel,
      rootInstanceContext(ri, e),
      model,
      ret,
      query
    ).ifResult((r) => {
      if (r.kind === "cont") {
        ret.continuityStatements.push(r);
      }
      ret.relations.push(r);
    }, iproblems);
  }

  // Sixth, extract any common sets
  buildContinuitySets(query, ret).ifResult((c) => {
    ret.continuityGraph = c;
  }, iproblems);

  if (ret.qualifier === "external") {
    for (const [vname, vinst] of Object.entries(ret.variables)) {
      iproblems.push(
        unexpectedImplementation(
          vname,
          `Found variable ${vname} in external component definition ${ret.name.value}`,
          problemSpan(model, vinst.declarationSpan)
        )
      );
    }
    for (const cname of Object.keys(ret.components)) {
      iproblems.push(
        unexpectedImplementation(
          cname,
          `Found subcomponent ${cname} in external component definition ${ret.name.value}`,
          problemSpan(model, model.span)
        )
      );
    }
    for (const eq of ret.relations) {
      iproblems.push(
        unexpectedImplementation(
          ret.name.value,
          `External component ${ret.name.value} contains unexpected relations`,
          problemSpan(model, eq.span)
        )
      );
    }
  }

  const fe = query(
    getFileNode(query(getDefinitionRelations(model)).file, isFileContents)
  );

  fe.ifResult((v) => {
    if (isParsedFile(v)) {
      for (const rel of model.relations) {
        switch (rel.kind) {
          case "eq":
            const plhs = checkExpression(ret, v, rel.lhs, query);
            iproblems.push(...plhs);
            const prhs = checkExpression(ret, v, rel.rhs, query);
            iproblems.push(...prhs);
            break;
          case "cxn":
            break;
          case "st":
            break;
        }
      }
    }
  }, iproblems);

  instLog("Instance tree for %s: %j", model.name, ret);
  return partialResult(ret, ...iproblems);
}

function processVariableDeclaration(
  model: ComponentDefinition,
  e: DefinitionEntity,
  query: QueryHandler,
  cn: string,
  c: VariableDeclaration,
  iproblems: Problem[],
  ret: ModelInstance
) {
  instantiateVariable(cn, c, e, model, query).ifResult((v) => {
    switch (c.variability) {
      case "variable": {
        ret.variables[cn] = v;
        break;
      }
      case "structural": {
        v.default.ifJust((d) => {
          const text = unparseMTKExpression(d);
          ret.substitutions[cn] = text;
        });
        ret.structural[cn] = v;
        break;
      }
      case "parameter": {
        v.default.ifJust((d) => {
          const text = unparseMTKExpression(d);
          ret.substitutions[cn] = text;
        });
        ret.parameters[cn] = v;
        break;
      }
      case "path": {
        v.default.ifJust((d) => {
          const text = unparseMTKExpression(d);
          ret.substitutions[cn] = text;
        });
        ret.pathVariables[cn] = v;
        break;
      }
      case "constant": {
        v.default.ifJust((d) => {
          const text = unparseMTKExpression(d);
          ret.substitutions[cn] = text;
        });
        ret.constants[cn] = v;
        break;
      }
      default: {
        assertUnreachable(c.variability);
      }
    }
  }, iproblems);
}

function processComponentDeclaration(
  model: ComponentDefinition,
  query: QueryHandler,
  cn: string,
  c: ComponentDeclaration,
  iproblems: Problem[],
  ret: ModelInstance
) {
  query(resolveType(c.instance.name, model, [])).ifResult((cdef) => {
    switch (cdef.resolves) {
      case "strcon": {
        instantiateRecordConnector(cdef.def, c, c.span, query).ifResult(
          (v) => {
            ret.connectors[cn] = v;
          },

          iproblems
        );
        break;
      }
      case "sclcon": {
        instantiateScalarConnector(cdef.def, c, c.span).ifResult((v) => {
          ret.connectors[cn] = v;
        }, iproblems);
        break;
      }
      case "cdef": {
        ret.components[cn] = nestedInstance(cn, c, model, cdef.def, query);

        break;
      }
      case "scalar": {
        throw new UnimplementedError(
          "processComponentDeclaration",
          `Instantiation of scalar types is currently unimplemented`
        );
      }
      case "struct": {
        throw new UnimplementedError(
          "processComponentDeclaration",
          `Instantiation of struct types is currently unimplemented`
        );
      }
      case "enum": {
        throw new UnimplementedError(
          "processComponentDeclaration",
          `Instantiation of enum types is currently unimplemented`
        );
      }
      case "fun": {
        throw new UnimplementedError(
          "processComponentDeclaration",
          `Instantiation of function types is currently unimplemented`
        );
      }
      case "adef": {
        throw new UnimplementedError(
          "processComponentDeclaration",
          `Instantiation of analyses is currently unimplemented`
        );
      }
      /* istanbul ignore next */
      default:
        assertUnreachable(cdef);
    }
  }, iproblems);
}

/**
 * This function creates the closure that instantiates sub-compoents
 *
 * @param cn Subcomponent name
 * @param decl Declaration of the subcomponent to be instantiated
 * @param parent The component definition of the model that contains this declaration
 * @param cdef The component definition of the subcomponent
 * @param workspace The workspace
 * @returns A closure that calls `instantiateComponent`
 */
export function nestedInstance(
  cn: string,
  decl: ComponentDeclaration,
  parent: ComponentDefinition,
  cdef: ComponentDefinition,
  query: QueryHandler
) {
  return () => {
    modelLog(
      "Triggering recursive instantiation of comp %s as subcomponent %s",
      cdef.name.value,
      cn
    );
    const ret = computed(() => instantiateComponent(cdef, decl, query), {
      keepAlive: true,
    });
    return ret.get();
  };
}

function checkExpression(
  model: ModelInstance,
  file: ParsedFile,
  expr: Expression,
  query: QueryHandler
): TextProblem[] {
  return exprCase(expr, {
    arr: () => [],
    bexp: (node) => [
      ...checkExpression(model, file, node.lhs, query),
      ...checkExpression(model, file, node.rhs, query),
    ],
    blit: () => [],
    // TODO: resolve type of function and then check
    // inputs and outputs
    call: () => [],
    // TODO: This will involve some nested instantiation to check
    cref: (node) => {
      const def = query(model.def);
      if (node.elems.length === 1) {
        for (const g of globalVariables) {
          if (g.name === node.elems[0].name) {
            return [];
          }
        }
      }
      const i = walkInstance(model, def, node, query);
      const ret: TextProblem[] = i
        .problems()
        .map((p) => contextualizeProblem(def, p));
      return ret;
    },
    ilit: () => [],
    rlit: () => [],
    range: (node) =>
      node.step
        ? [
            ...checkExpression(model, file, node.start, query),
            ...checkExpression(model, file, node.step, query),
            ...checkExpression(model, file, node.end, query),
          ]
        : [
            ...checkExpression(model, file, node.start, query),
            ...checkExpression(model, file, node.end, query),
          ],
    paren: (node) => [...checkExpression(model, file, node.expr, query)],
    slit: () => [],
    texp: (node) => [
      ...checkExpression(model, file, node.cond, query),
      ...checkExpression(model, file, node.yes, query),
      ...checkExpression(model, file, node.no, query),
    ],
    uexp: (node) => [...checkExpression(model, file, node.rhs, query)],
    ulit: () => [],
  });
}
