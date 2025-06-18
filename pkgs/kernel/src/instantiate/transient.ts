import {
  AnalysisDefinition,
  Modifications,
  ProblemSpan,
} from "@juliacomputing/dyad-ast";
import {
  problemError,
  Result,
  ProblemInstanceConstructor,
} from "@juliacomputing/dyad-common";
import { Maybe } from "purify-ts/Maybe";
import { QueryHandler } from "../workspace/index.js";
import { ModelInstance } from "./model.js";
import { UnimplementedError } from "../workspace/errors.js";

export const invalidType: ProblemInstanceConstructor<void> = problemError(
  "invalid-type",
  "Invalid type"
);
export const requiredValue = problemError<ProblemSpan>(
  "required-value",
  "Required value"
);

export const integratorOptions = ["auto", "Rodas4", "FBDF", "Tsit5"] as const;
export type IntegratorOptions = (typeof integratorOptions)[number];

/** Information needed required for a transient analysis */
export interface TransientAnalysisInstance {
  analysis: "transient";
  /** The name of the analysis instance */
  name: string;
  /** Component definition that the analysis resolves to */
  model: ModelInstance;
  /** Choice of integrator, default = auto */
  integrator: IntegratorOptions;
  /** Absolute tolerance to use when solving this system */
  abstol: number;
  /** Relative tolerance to use when solving this system */
  reltol: number;
  /** Maximum time step */
  dtmax: Maybe<number>;
  /** Start time for analysis */
  start: number;
  /** Stop time for analysis */
  stop: number;
}

export function instantiateTransientAnalysis(
  _analysis: AnalysisDefinition,
  _instanceModifications: Modifications,
  _query: QueryHandler
): Result<TransientAnalysisInstance> {
  throw new UnimplementedError(
    "instantiateTransientAnalysis",
    "Old style transient analyses are no longer supported"
  );
}
