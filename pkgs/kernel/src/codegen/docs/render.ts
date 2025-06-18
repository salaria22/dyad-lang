import { Entity, entitySelector } from "../../workspace/entities/index.js";
import { Result } from "@juliacomputing/dyad-common";
import { Selector } from "../../workspace/index.js";

export function renderMarkdown(entity: Entity): Selector<Result<string>> {
  return ({ attrs, query }) => {
    const rels = query(entitySelector(entity)).map(attrs.getRelations);
    return rels.map((r) => `## ${entity}\n\n${JSON.stringify(r, null, 4)}`);
  };
}
