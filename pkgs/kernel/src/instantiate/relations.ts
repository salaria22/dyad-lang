import { Relation, ComponentDefinition } from "@juliacomputing/dyad-ast";
import {
  Result,
  assertUnreachable,
  failedResult,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { QueryHandler } from "../workspace/selector.js";
import {
  AnalysisPointInstance,
  instantiateAnalysisPoint,
} from "./analysis_point.js";
import { AssertionInstance, instantiateAssertion } from "./assertion.js";
import { ConnectionInstance, instantiateConnection } from "./connection.js";
import { InstanceContext } from "./context.js";
import { equationInstance, EquationInstance } from "./equation.js";
import {
  ForLoopInstance,
  instantiateForLoop,
  isForLoopInstance,
} from "./for.js";
import { ModelInstance } from "./model.js";
import {
  ContintuitySetRelationInstance,
  instantiateContinuitySetRelation,
} from "./continuity.js";
import { UnimplementedError } from "../workspace/errors.js";
import {
  IfStatementInstance,
  instantiateIfStatement,
  isIfStatementInstance,
} from "./ifs.js";
import {
  instantiateSwitchStatement,
  isSwitchStatementInstance,
  SwitchStatementInstance,
} from "./switch.js";

export type RelationInstance =
  | EquationInstance
  | AssertionInstance
  | AnalysisPointInstance
  | ContintuitySetRelationInstance
  | ForLoopInstance
  | IfStatementInstance
  | SwitchStatementInstance
  | ConnectionInstance;

export function isControlFlowInstance(
  rel: RelationInstance
): rel is ForLoopInstance | IfStatementInstance {
  return (
    isForLoopInstance(rel) ||
    isIfStatementInstance(rel) ||
    isSwitchStatementInstance(rel)
  );
}

export function instantiateRelation(
  rel: Relation,
  ictxt: InstanceContext,
  model: ComponentDefinition,
  instance: ModelInstance,
  query: QueryHandler
): Result<RelationInstance> {
  switch (rel.kind) {
    case "assert":
      return instantiateAssertion(rel, ictxt);
    case "cont":
      return instantiateContinuitySetRelation(rel, ictxt);
    case "cxn":
      return instantiateConnection(query, instance, rel, ictxt);
    case "eq":
      return successfulResult(equationInstance(rel, ictxt));
    case "ap":
      return instantiateAnalysisPoint(rel, instance, model, ictxt);
    case "forl":
      return instantiateForLoop(rel, instance, model, ictxt, query);
    case "ifs":
      return instantiateIfStatement(rel, instance, model, ictxt, query);
    case "sw":
      const inst = instantiateSwitchStatement(
        rel,
        instance,
        model,
        ictxt,
        query
      );
      return inst;
    case "st":
      return failedResult(
        new UnimplementedError(
          "instantiateRelation",
          `Instantiation doesn't currently support '${rel.kind}' relations`
        )
      );
    default:
      assertUnreachable(rel);
  }
}
