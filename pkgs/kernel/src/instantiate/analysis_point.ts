import { AnalysisPoint, ComponentDefinition } from "@juliacomputing/dyad-ast";
import {
  failedResult,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  normalizeAnalysisPoint,
  NormalizedDyadAnalysisPoint,
} from "../metadata/index.js";
import { problemSpan } from "../workspace/index.js";
import { ModelInstance } from "./model.js";
import { existingAnalysisPoint, invalidAnalysisPoint } from "./errors.js";
import { unparseExpression } from "@juliacomputing/dyad-parser";
import { RelationInstance } from "./relations.js";
import { InstanceContext } from "./context.js";

export interface AnalysisPointInstance extends AnalysisPoint, InstanceContext {
  normalized: NormalizedDyadAnalysisPoint;
}

export function isAnalysisPointInstance(
  rel: RelationInstance
): rel is AnalysisPointInstance {
  return rel.kind === "ap";
}

export function instantiateAnalysisPoint(
  rel: AnalysisPoint,
  instance: ModelInstance,
  model: ComponentDefinition,
  ictxt: InstanceContext
): Result<AnalysisPointInstance> {
  const id = rel.name.value;
  if (instance.relations.some((r) => r.kind === "ap" && r.name.value === id)) {
    return failedResult(
      existingAnalysisPoint(
        id,
        `Analysis point ${id} already exists in definition ${model.name.value}`,
        problemSpan(model, rel.name.span)
      )
    );
  }
  if (rel.connectors.length !== 2) {
    return failedResult(
      invalidAnalysisPoint(
        id,
        `Analysis point ${id} should reference 2 connectors, but it references ${rel.connectors.length}`,
        problemSpan(model, rel.span)
      )
    );
  }
  const lc = unparseExpression(rel.connectors[0]);
  const rc = unparseExpression(rel.connectors[1]);
  const connectionIndex = model.relations.find((cxn) => {
    if (cxn.kind !== "cxn") {
      return false;
    }
    const cexpr = cxn.connectors.map(unparseExpression);
    return cexpr.includes(lc) && cexpr.includes(rc);
  });
  if (connectionIndex === undefined) {
    return failedResult(
      invalidAnalysisPoint(
        id,
        `Analysis point ${id} is invalid because no connection currently exists between ${lc} and ${rc}, perhaps a connection is missing.`,
        problemSpan(model, rel.span)
      )
    );
  }
  const api: AnalysisPointInstance = {
    ...rel,
    kind: "ap",
    ...ictxt,
    normalized: normalizeAnalysisPoint(rel.metadata?.value ?? {}),
  };
  return successfulResult(api);
}
