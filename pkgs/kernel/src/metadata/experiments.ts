import { z } from "zod";

export const individualExperimentSchema = z.object({
  start: z
    .number()
    .default(0.0)
    .describe("start time of simulation (optional, default is 0.0)"),
  stop: z.number().describe("experiment stop time"),
  params: z
    .record(z.string(), z.any())
    .default({})
    .describe("optional parameter values to use for a given experiment"),
  initial: z
    .record(z.string(), z.number())
    .default({})
    .describe("initial conditions to use"),
});
export type IndividualExperimentSchema = z.infer<
  typeof individualExperimentSchema
>;

export const experimentsSchema = z.record(
  z.string().describe("experiment name"),
  individualExperimentSchema
);
export type ExperimentsSchema = z.infer<typeof experimentsSchema>;

export interface NormalizedIndividualExperiment {
  start: number;
  stop: number;
  params: Record<string, any>;
  initial: Record<string, any>;
}

export type NormalizedExperimentsMetadata = Record<
  string,
  NormalizedIndividualExperiment
>;

export function normalizeExperiment(
  v: IndividualExperimentSchema
): NormalizedIndividualExperiment {
  return {
    ...v,
    start: v.start ?? 0.0,
    params: v.params ?? {},
    initial: v.initial ?? {},
  };
}

export function normalizeExperiments(
  v: ExperimentsSchema
): NormalizedExperimentsMetadata {
  return Object.fromEntries(
    Object.entries(v).map(([key, v]) => [key, normalizeExperiment(v)])
  );
}
