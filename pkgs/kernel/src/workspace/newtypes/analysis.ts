import { DefinitionEntity } from "../entities/definitions.js";
import { ComponentElement, VariableElement } from "./declaration.js";

/**
 * At this point, there isn't really a use case where we talk strictly in terms
 * of an analysis interface (since this isn't a component that we connect).  Said
 * another way, all we do is construct these, we don't really compose these
 * (although one analysis CAN nest another analysis...but this is still just
 * construction and no other interactions)
 */
export interface AnalysisInstanceType {
  resolves: "analysis";

  /**
   * This is used when comparing origin information across declarations and
   * relations.
   */
  self: DefinitionEntity;

  /**
   * All parameters must be of "variable" types.  The only qualifier that could
   * be added as from the declaration is `final`.
   **/
  parameters: Map<string, VariableElement>;
  /**
   * This is the set of components.  Components are not part of the interface.
   * But information about components is necessary a) when constructing them and
   * b) when performing semantic checks internal to a component.  The only
   * possible qualifiers at the declaration level is `final`
   */
  components: Map<string, ComponentElement>;
}

/**
 * Create a type that can represent an analysis instance
 *
 * @returns
 */
export function analysisInstanceType(
  self: DefinitionEntity
): AnalysisInstanceType {
  return {
    resolves: "analysis",
    self,
    parameters: new Map(),
    components: new Map(),
  };
}

/**
 * Predicate to determine if a value is an analysis instance type
 *
 * @param t
 * @returns
 */
export function isAnalysisInstanceType(t: unknown): t is AnalysisInstanceType {
  return (
    typeof t === "object" &&
    t !== null &&
    "resolves" in t &&
    t.resolves === "analysis"
  );
}
