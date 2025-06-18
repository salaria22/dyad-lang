import { DefinitionEntity } from "../index.js";

/**
 * This is additional information (augmenting the normal `Relation`)
 * information that tells use where a relation came from
 */
export interface InstanceContext {
  origin: DefinitionEntity;
  /**
   * The index in the definitions `relations` array.  Since the introduction
   * of control structures, this is insufficient.
   *
   * @deprecated
   */
  index: number;
  /**
   * This index is capable of addressing nested relations.
   */
  treeIndex: number[];
}

export function rootInstanceContext(index: number, origin: DefinitionEntity) {
  return {
    origin,
    index,
    treeIndex: [index],
  };
}

export function nestedInstanceContext(
  cur: InstanceContext,
  first: number,
  ...rest: number[]
) {
  return {
    origin: cur.origin,
    index: cur.index,
    treeIndex: [...cur.treeIndex, first, ...rest],
  };
}
