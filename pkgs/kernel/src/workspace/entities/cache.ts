import { computed, IComputedValue } from "mobx";
import { Entity } from "./entities.js";
import { Result } from "@juliacomputing/dyad-common";
import { Workspace } from "../workspace.js";
import { QueryHandler } from "../selector.js";

export class EntityCache<K extends Entity, T> {
  protected cache: Map<K, IComputedValue<Result<T>>>;
  constructor(
    protected compute: (key: K, query: QueryHandler) => Result<T>,
    protected pred: (x: Entity) => x is K
  ) {
    this.cache = new Map();
  }
  /** Get the value associated with a particular key */
  get(key: K, query: QueryHandler): Result<T> {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached.get();
    }
    const cv = computed(() => this.compute(key, query));
    this.cache.set(key, cv);
    return cv.get();
  }
  /**
   * Perform garbage collection on this cache.  This works by a kind of mark and
   * sweep approach.  It copies all entries associated with known entities to a
   * new map and then disposes of the old one.  It might be possible to do this
   * in a more efficient way, but since we won't really need to perform garbage
   * collection very often, I'm not too worried about it right now.
   *
   * @param workspace
   */
  gc(workspace: Workspace) {
    const next = new Map<K, IComputedValue<Result<T>>>();
    const attrs = workspace.query(({ attrs }) => attrs);
    for (const key of attrs.knownEntities()) {
      if (this.pred(key)) {
        const cv = this.cache.get(key);
        if (cv !== undefined) {
          next.set(key, cv);
        }
      }
    }
    this.cache = next;
  }
}
