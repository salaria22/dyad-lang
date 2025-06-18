import {
  ComponentDefinition,
  expressionSpan,
  isCompRef,
  SwitchStatement,
} from "@juliacomputing/dyad-ast";
import {
  failedResult,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { QueryHandler } from "../workspace/selector.js";
import { InstanceContext, nestedInstanceContext } from "./context.js";
import { ModelInstance } from "./model.js";
import { instantiateRelation, RelationInstance } from "./relations.js";
import { walkInstance } from "./walk.js";
import { UnexpectedTypeError } from "./errors.js";
import { unparseExpression } from "@juliacomputing/dyad-parser";
import { problemSpan } from "../workspace/utils.js";
import { isVariableInstance } from "./instance.js";
import { ResolvedEnumType } from "../workspace/index.js";
import { VariableInstance } from "./variable.js";

export interface SwitchStatementInstance
  extends SwitchStatement,
    InstanceContext {
  enum: ResolvedEnumType;
  vinst: VariableInstance;
  instances: Record<string, RelationInstance[]>;
}

export function instantiateSwitchStatement(
  rel: SwitchStatement,
  instance: ModelInstance,
  model: ComponentDefinition,
  ictxt: InstanceContext,
  query: QueryHandler
): Result<SwitchStatementInstance> {
  if (!isCompRef(rel.val)) {
    const inst = unparseExpression(rel.val);
    return failedResult(
      UnexpectedTypeError(
        inst,
        `switch statement expects a reference to an enum type but ${inst} is not a variable reference`,
        problemSpan(model, expressionSpan(rel.val))
      )
    );
  }
  const val = walkInstance(instance, model, rel.val, query);
  const results: Record<string, Result<RelationInstance[]>> = {};
  const cases = Object.entries(rel.cases);
  for (let ci = 0; ci < cases.length; ci++) {
    const id = cases[ci][0];
    const clause = cases[ci][1];
    const cctxt = nestedInstanceContext(ictxt, ci);
    const rels = clause.rels.map((child, i) =>
      instantiateRelation(
        child,
        nestedInstanceContext(cctxt, i),
        model,
        instance,
        query
      )
    );
    results[id] = Result.all(rels);
  }
  const res = Result.combine(results);
  const ret = Result.combine({ val, res }).chain(({ val, res }) => {
    if (!isVariableInstance(val) || val.type.resolves !== "enum") {
      const inst = unparseExpression(rel.val);
      return failedResult(
        UnexpectedTypeError(
          inst,
          `switch statement expects a reference to a variable of enum type but ${inst} is not a variable of enum type`,
          problemSpan(model, expressionSpan(rel.val))
        )
      );
    }
    const ret: SwitchStatementInstance = {
      ...rel,
      vinst: val,
      enum: val.type,
      instances: res,
      ...ictxt,
    };
    return successfulResult(ret);
  });
  return ret;
}

export function isSwitchStatementInstance(
  rel: RelationInstance
): rel is SwitchStatementInstance {
  return rel.kind === "sw";
}
