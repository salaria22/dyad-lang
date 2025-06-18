import { DefinitionEntity } from "../entities/index.js";
import { ContinuitySet } from "./continuity.js";
import {
  ComponentElement,
  ConnectorElement,
  VariableElement,
} from "./declaration.js";

/**
 * This represents all the "type" information about a component.
 **/
export interface ComponentInstanceType {
  resolves: "comp";

  /**
   * The definition that this instance is derived from.  We use this to keep
   * track of which elements of the component come from which definitions in the
   * context of inheritance.
   */
  self: DefinitionEntity;

  /** All connectors are defined only in terms of Dyad definitions */
  connectors: Map<string, ConnectorElement>;
  /**
   * All parameters must be of "variable" types.  The only qualifier that could
   * be added as from the declaration is `final`.
   **/
  parameters: Map<string, VariableElement>;
  /**
   * This is the set of components.  Components are not part of the interface.
   * But information about components is necessary a) when constructing them and
   * b) when performing semantic checks internal to a component.  The only possible
   * qualifiers at the declaration level is `final`
   */
  components: Map<string, ComponentElement>;
  /**
   * If we replace a component that provides continuity, we might "isolate" path
   * variables that were properly defined in the original component.  For this
   * reason we may wish to impose a semantic restriction that any component is
   * replaced by a component that provides _at least_ the same continuity
   * statements (although more edges would be fine).  Note this would be overly
   * conservative (legal models could result even in cases that violate this
   * restriction).
   */
  continuitySets: Array<ContinuitySet>;
}

/**
 * Create a type that represents an instance of a component
 *
 * @returns
 */
export function componentInstanceType(
  self: DefinitionEntity
): ComponentInstanceType {
  return {
    resolves: "comp",
    self,
    connectors: new Map(),
    parameters: new Map(),
    components: new Map(),
    continuitySets: [],
  };
}

/**
 * Predicate to determine if a value is a component instance type
 *
 * @param t
 * @returns
 */
export function isComponentInstanceType(
  t: unknown
): t is ComponentInstanceType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "comp"
  );
}
