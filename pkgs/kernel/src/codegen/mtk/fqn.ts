import { Definition } from "@juliacomputing/dyad-ast";
import {
  QueryHandler,
  unparseDefinitionEntity,
} from "../../workspace/index.js";
import { getDefinitionEntity } from "../../workspace/selectors/index.js";

export function FullyQualifiedName(
  query: QueryHandler,
  def: Definition
): string {
  const rels = query(getDefinitionEntity(def));
  const parts = unparseDefinitionEntity(rels);
  return [parts.library, ...parts.modules, parts.definition].join(".");
}
