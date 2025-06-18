import { ASTNode } from "@juliacomputing/dyad-ast";
import { Entity, EntityNode, RelatedEntities } from "../entities/index.js";
import { computed } from "mobx";
import { entityMap } from "./entities.js";
import { CompilerAssertionError } from "../errors.js";
import { QueryHandler } from "../selector.js";
import { Maybe } from "purify-ts";

/**
 * This class stores all the attributes associated with the AST and various
 * methods for working with those attributes.
 */
export class Attributes {
  /**
   * Keep track of the mappings from Entity <-> EntityNode
   *
   * This involves not just the bidirectional mapping but since we have
   * to walk the tree to build the Entity <-> EntityNode mapping we also
   * store away entity _relationship_ in a map as well.
   **/
  @computed
  protected get entities() {
    return entityMap(this.query);
  }
  constructor(protected query: QueryHandler) {}

  getEntityNode(entity: Entity): Maybe<ASTNode> {
    return Maybe.fromNullable(this.entities.nodes.get(entity));
  }

  /**
   * Get the entities associated with a given `EntityNode`.  This includes all
   * related entities (including self).
   *
   * @param entity
   * @returns
   */
  getRelations(entity: EntityNode): RelatedEntities {
    const rels = this.entities.nodeRelations.get(entity);
    if (rels === undefined) {
      const other = this.getEntityNode("urn:definition:Issue249::Empty");
      other.caseOf({
        Just: (o) => {
          console.warn(
            "Found urn:definition:Issue249::Empty, equal to entity? ",
            entity === o
          );
        },
        Nothing: () => {
          console.warn(
            "Couldn't find a node for urn:definition:Issue249::Empty"
          );
        },
      });
      throw new CompilerAssertionError(
        "getRelations",
        `Found EntityNode of type ${entity.kind} with no entity mapping: ${JSON.stringify(entity, null, 4)}`
      );
    }
    return rels;
  }

  /** Returns the set of all known entities */
  knownEntities(): IterableIterator<Entity> {
    return this.entities.entities.keys();
  }

  /**
   * Filter over the global set of all possible entities for those that match
   * given predicate.
   **/
  getMatchingEntity<U extends Entity>(
    pred: (value: Entity) => value is U
  ): Array<U>;
  getMatchingEntity(pred: (x: Entity) => boolean): Array<Entity>;
  getMatchingEntity(
    pred: (x: Entity) => boolean | ((value: Entity) => value is any)
  ) {
    return [...this.entities.entities.keys()].filter(pred);
  }

  close() {}
}
