import {
  ComponentDefinition,
  ElseIfClause,
  IfStatement,
} from "@juliacomputing/dyad-ast";
import { Result } from "@juliacomputing/dyad-common";
import { QueryHandler } from "../workspace/selector.js";
import { InstanceContext, nestedInstanceContext } from "./context.js";
import { ModelInstance } from "./model.js";
import { instantiateRelation, RelationInstance } from "./relations.js";

export interface IfStatementInstance extends IfStatement, InstanceContext {
  yesInstances: RelationInstance[];
  elseInstances: ElseClauseInstance[];
  noInstances: RelationInstance[];
}

export interface ElseClauseInstance extends ElseIfClause {
  instances: RelationInstance[];
}

export function instantiateIfStatement(
  rel: IfStatement,
  instance: ModelInstance,
  model: ComponentDefinition,
  ictxt: InstanceContext,
  query: QueryHandler
): Result<IfStatementInstance> {
  const yesInstances = Result.all(
    rel.yes.map((child, i) =>
      instantiateRelation(
        child,
        nestedInstanceContext(ictxt, 0, i), // 0 = yes
        model,
        instance,
        query
      )
    )
  );
  const elseInstances = Result.all(
    rel.elif.map((child, i) => {
      const children = Result.all(
        child.rels.map((child, j) => {
          return instantiateRelation(
            child,
            nestedInstanceContext(ictxt, i + 1, j), // i+1 = else clause, j = relation in else clause
            model,
            instance,
            query
          );
        })
      );
      return children.map(
        (instances): ElseClauseInstance => ({
          ...child,
          instances,
        })
      );
    })
  );
  const noInstances = Result.all(
    rel.yes.map((child, i) =>
      instantiateRelation(
        child,
        nestedInstanceContext(ictxt, rel.elif.length + 1, i), // rel.elif.length+1 = yes
        model,
        instance,
        query
      )
    )
  );
  return Result.combine({ yesInstances, elseInstances, noInstances }).map(
    ({ yesInstances, elseInstances, noInstances }) => {
      return {
        ...rel,
        ...ictxt,
        yesInstances,
        elseInstances,
        noInstances,
      };
    }
  );
}

export function isIfStatementInstance(
  rel: RelationInstance
): rel is IfStatementInstance {
  return rel.kind === "ifs";
}
