import {
  ComponentDefinition,
  ForLoopStatement,
} from "@juliacomputing/dyad-ast";
import { Result } from "@juliacomputing/dyad-common";
import { QueryHandler } from "../workspace/selector.js";
import { InstanceContext, nestedInstanceContext } from "./context.js";
import { ModelInstance } from "./model.js";
import { instantiateRelation, RelationInstance } from "./relations.js";

export interface ForLoopInstance extends ForLoopStatement, InstanceContext {
  instances: RelationInstance[];
}

export function instantiateForLoop(
  rel: ForLoopStatement,
  instance: ModelInstance,
  model: ComponentDefinition,
  ictxt: InstanceContext,
  query: QueryHandler
): Result<ForLoopInstance> {
  const children = rel.relations.map((child, i) =>
    instantiateRelation(
      child,
      nestedInstanceContext(ictxt, i),
      model,
      instance,
      query
    )
  );
  return Result.all(children).map((instances) => ({
    ...rel,
    ...ictxt,
    instances,
  }));
}

export function isForLoopInstance(
  rel: RelationInstance
): rel is ForLoopInstance {
  return rel.kind === "forl";
}
