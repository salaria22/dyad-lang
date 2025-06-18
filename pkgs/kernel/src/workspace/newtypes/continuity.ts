import { CompRef } from "@juliacomputing/dyad-ast";
import { Maybe, Nothing } from "purify-ts";

/**
 * A `ContinuitySet` is a graph local to a component that indicates any
 * constraints between `path` variables on connectors or declared locally in the
 * component.  The `ContinuitySet` is a representation of all the nodes in the
 * connection graph.  It is local to a component meaning that it never refers to
 * anything outside the component.  For convenience, the nodes are organized
 * into distinct groups because this makes it easier to perform semantic checks.
 * The groupings are as follows:
 *
 * - `master`: The identify of a `path` variable declared in the component that
 *   acts as the "master" (root) of the connection set.  There may not be a
 *   master node in a given component.  But if there is, it is then used to
 *   determine the value of the path variable for any connected `path` variables
 *   in all child components.
 * - `local`: All connectors of this component instance that have `path` fields
 *   that are in this set.
 * - `nested`: All connectors of sub-components of this component instance that
 *   have are connected to this set.
 *
 * There is a semantic restriction that there cannot simultaneously be a
 * `master` node and any `local` nodes.  In other words, if there is a `master`
 * node, then the `local` nodes array must be empty.  Similarly, if there are
 * any `local` nodes, then the `master` node must be `Nothing`.  This is because
 * the `master` node value is cascaded down to all sub-components and must be
 * passed to those components when they are constructed (because the `path`
 * variable may be or contain a structural parameter). The presence of `local`
 * nodes implies that this component (instead) gets its value not from a
 * `master` node but instead inherits the value of the `path` variable in the
 * set. A given component cannot both inherit a value and set the value (hence
 * it cannot have both a `master` node and `local` nodes).  The `nested` nodes
 * will inherit either the `master` value or the value cascaded in via the
 * `local` nodes.
 */
export interface ContinuitySet {
  /**
   * The identity of the local `path` variable that specifies the value for all
   * `path` variables in this set and all `nested` nodes. Otherwise, we'll need
   * to create a "virtual" path variable during code generation.
   */
  master: Maybe<CompRef>;
  /**
   * All connectors of this component instance that have path fields that are in
   * this set.  As noted above, this set must be empty if there is a `master`.
   */
  local: Array<CompRef>;
  /**
   * All connectors of sub-components of this component instance that have
   * path fields in this set.  These will inherit their `path` variable values
   * from either `master` or `local`, depending on which is present.
   */
  nested: Array<CompRef>;
}

/**
 * Creates an empty continuity set
 *
 * @returns
 */
export function continuitySet(): ContinuitySet {
  return {
    master: Nothing,
    local: [],
    nested: [],
  };
}
