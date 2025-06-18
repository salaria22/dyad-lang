import { DocString } from "@juliacomputing/dyad-ast";
import { VariableInstance } from "./variable.js";
import { EquationInstance } from "./equation.js";
import { Nullable } from "@juliacomputing/dyad-common";
import {
  normalizeDefinition,
  NormalizedDyadDefinition,
} from "../metadata/index.js";
import { ModelInstance } from "./model.js";
import { DefinitionEntity } from "../workspace/index.js";

export interface AnalysisInstance {
  /** Name of the analysis */
  name: string;
  /** Name of the Julia analysis that this is based on */
  basename: string;
  /** Packages that define `...Spec` and `run_analysis(...::...Spec)` */
  packages: string[];
  /** Entity this is an instance of */
  self: DefinitionEntity;
  /**
   * Indicates whether this analysis is partial (_i.e.,_ whether we need to
   * generate any code for this.
   **/
  partial: boolean;
  /** All subcomponents associated with this instance */
  components: Record<string, ModelInstance>;
  /** All parameters associated with this instance */
  parameters: Record<string, VariableInstance>;
  relations: Array<EquationInstance>;
  /** The doc string associated with the instance */
  doc_string: Nullable<DocString>;
  /** Any metadata associated with the definition */
  definition_metadata: NormalizedDyadDefinition;
}

export function analysisInstance(
  name: string,
  self: DefinitionEntity,
  basename: string,
  partial: boolean,
  packages: string[]
): AnalysisInstance {
  return {
    name,
    self,
    basename,
    packages,
    partial,
    components: {},
    parameters: {},
    relations: [],
    doc_string: null,
    definition_metadata: normalizeDefinition({}),
  };
}
