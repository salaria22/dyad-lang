import {
  AnalysisDefinition,
  ComponentDeclaration,
  Modifications,
  hasExpression,
  isComponentDeclaration,
  qualifiedName,
} from "@juliacomputing/dyad-ast";
import { Either, Left, Right } from "purify-ts/Either";
import { TypeNotFound, UnimplementedError } from "../workspace/errors.js";
import {
  Problem,
  Result,
  failedResult,
  partialResult,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  DefinitionEntity,
  getDefinitionEntity,
  InflightLookups,
  problemSpan,
  QueryHandler,
  resolveType,
} from "../workspace/index.js";
import {
  existingElement,
  unexpectedDeclarations,
  unexpectedValue,
  unknownElement,
} from "./errors.js";
import { invalidType } from "./transient.js";
import { AnalysisInstance, analysisInstance } from "./generic.js";
import { instantiateModel } from "./model.js";
import { Just, Maybe } from "purify-ts";
import { instantiateVariable } from "./variable.js";
import { unparseDefinitionEntity } from "../workspace/entities/definitions.js";

export function instantiateAnalysis(
  analysis: AnalysisDefinition,
  instanceModifications: Modifications,
  query: QueryHandler
): Result<AnalysisInstance> {
  /** Get the qualified name for the analysis we are extending from */
  const qn = qualifiedName(analysis.extends);
  /** Get the entity for _this_ analysis */
  const entity = query(getDefinitionEntity(analysis));

  /** A place to collect any problems we run into */
  const problems: Problem[] = [];
  /** Instantiate the base analysis (potentially recursively) */
  const binst = getBaseInstance(qn, entity, analysis, [], query);
  /** If we didn't get any kind of value back, just return the failure. */
  if (!binst.hasValue()) {
    return binst;
  }
  /** Collect the entries for the modifications on the extends clause */
  const entries = Object.entries(analysis.extends.mods ?? {}).filter(
    ([k]) => k !== "analysisSchema"
  );

  /**
   * If we extend from `Analysis` and there are modifications, this is an
   * error since `Analysis` is empty.  So collect those errors.
   */
  if (qn === "Analysis" && entries.length > 0) {
    problems.push(
      ...entries.map((x) =>
        unexpectedValue(
          x[0],
          `Unexpected modification of non-existent property ${x[0]} for base Analysis`,
          problemSpan(analysis, analysis.extends.span)
        )
      )
    );
  }
  /**
   * Instantiate a fresh generic analysis to represent the  _current_
   * analysis.
   **/
  const packages = Maybe.fromNullable(
    (analysis.metadata?.value ?? {})["using"]
  )
    .filter((x) => typeof x === "string")
    .map((x) => [x])
    .orDefault(binst.value.packages);
  const ret = analysisInstance(
    analysis.name.value,
    entity,
    binst.value.basename,
    analysis?.qualifier === "partial",
    packages
  );
  /** Now add the components from the base analysis */
  ret.components = Object.fromEntries(
    Object.entries(binst.value.components).map(([k, v]) => [k, { ...v }])
  );
  /** Now add the parameters from the base analysis */
  ret.parameters = Object.fromEntries(
    Object.entries(binst.value.parameters).map(([k, v]) => [k, { ...v }])
  );
  /**
   * Now process the modifications of the `extends` clause and apply them to
   * whatever parameters and components we have in this analysis.
   */
  for (const [key, val] of entries) {
    const comp = ret.components[key];
    const param = ret.parameters[key];
    if (comp) {
      // We could handle overriding a model in modifications, but let's defer that
      // for now just because it involves a little more work.
      problems.push(
        new UnimplementedError(
          "instantiateAnalysis",
          `Modification of component ${key} not currently supported in modifications`
        )
      );
    } else if (param && hasExpression(val)) {
      // Update the `default` field for this parameter with the new expression
      param.default = Just(val.expr);
    } else {
      const keys = [...Object.keys(ret.components)];
      problems.push(
        unknownElement(
          key,
          `Attempt to modify unknown element ${key} in ${
            analysis.name.value
          } (allowed values are: ${keys.join(", ")})`,
          problemSpan(analysis, analysis.extends.span)
        )
      );
    }
  }
  /** Now let's extract the entries for all the declarations in _this_ analysis. */
  const declarations = Object.entries(analysis.declarations);
  for (const [key, val] of declarations) {
    // Ensure the base instance doesn't have a parameter with this
    // name.
    if (ret.parameters[key] !== undefined) {
      problems.push(
        existingElement(
          key,
          `Parameter ${key} already exists in ${analysis.name.value}`,
          problemSpan(analysis, analysis.extends.span)
        )
      );
      continue;
    }
    if (val.kind === "cdecl") {
      // If this is a component declaration, instantiate it and add
      // it to the set of components
      instantiateComponent(val, query, analysis).ifResult((i) => {
        ret.components[key] = i;
      }, problems);
    } else {
      // If this is a variable declaration, instantiate it and add
      // it to the set of parameters.
      instantiateVariable(key, val, entity, analysis, query).ifResult((i) => {
        ret.parameters[key] = i;
      }, problems);
    }
  }
  // Process local contents
  return partialResult(ret, ...problems);
}

function getBaseInstance(
  qn: string,
  entity: DefinitionEntity,
  analysis: AnalysisDefinition,
  inflight: InflightLookups,
  query: QueryHandler
) {
  if (qn === "Analysis") {
    const packageAttr = Maybe.fromNullable(
      (analysis.metadata?.value ?? {})["using"]
    ).filter((x) => typeof x === "string");
    const packages = packageAttr.map((x) => [x]).orDefaultLazy(() => {
      const baseAnalysisName = analysis.name.value;
      const { library: packageName } = unparseDefinitionEntity(entity);
      // 'Dyad' is the standard library, so we don't need to add it to the using clause.
      if (packageName && packageName !== "Dyad") {
        return [
          `${packageName}: Abstract${baseAnalysisName}Spec, ${baseAnalysisName}Spec`
        ];
      }
      return [];
    });
    return successfulResult(
      analysisInstance(
        analysis.name.value,
        entity,
        analysis.name.value,
        true,
        packages
      )
    );
  }

  const base = query(resolveType(analysis.extends.name, analysis, inflight));
  if (!base.hasValue()) {
    // Resolve analysis inheritance
    return failedResult(
      new TypeNotFound(
        qn,
        `Unknown base analysis ${qn}`,
        problemSpan(analysis, analysis.extends.span)
      )
    );
  }
  const resolved = base.value;
  if (resolved.resolves !== "adef") {
    return failedResult(invalidType(qn, `Extending from non-analysis ${qn}`));
  }
  // Note, we pass in empty modifications because we are about to process
  // them here...
  return instantiateAnalysis(resolved.def, {}, query);
}

function instantiateComponent(
  decl: ComponentDeclaration,
  query: QueryHandler,
  analysis: AnalysisDefinition
) {
  const dtype = query(resolveType(decl.instance.name, analysis, []));
  return dtype.chain((q) => {
    if (q.resolves !== "cdef") {
      throw invalidType(
        q.resolves,
        `Expecting model to be a component but resolved to ${q.resolves}`
      );
    }
    return instantiateModel(
      q.def,
      decl.instance.mods || {},
      decl.metadata,
      query
    );
  });
}

/**
 * Find all the named components in the analysis definition.
 *
 * TODO: needs to be expanded to handle optional components as well.
 *
 * @param names
 * @param analysis
 * @returns
 */
export function extractComponents(
  names: string[],
  analysis: AnalysisDefinition
): Either<Problem, ComponentDeclaration[]> {
  const ret: ComponentDeclaration[] = [];
  const keys = new Set();

  /** Make a list of all declared components (not variables) */
  for (const [name, value] of Object.entries(analysis.declarations)) {
    if (isComponentDeclaration(value)) {
      keys.add(name);
    }
  }

  /** Loop over the expected component names... */
  for (const name of names) {
    const val = analysis.declarations[name];
    if (val !== undefined) {
      // If we find a component with the name we expected, make a note and cross
      // it off the list.
      if (isComponentDeclaration(val)) {
        ret.push(val);
        keys.delete(name);
      } else {
        // Otherwise, the thing we are looking for is here, but it isn't a component.
        return Left(
          unexpectedValue(
            name,
            `Component ${name} was expected to be a component but wasn't`,
            problemSpan(analysis, val.span)
          )
        );
      }
    }
  }
  // If we get here and we haven't crossed everything off our list, there are components
  // here that are not allowed for this type of analysis.
  if (keys.size > 0) {
    return Left(
      unexpectedDeclarations(
        analysis.name.value,
        `Found the following unexpected declarations in ${
          analysis.name.value
        }: ${[...keys].join(", ")}`,
        problemSpan(analysis, analysis.span)
      )
    );
  }
  return Right(ret);
}
