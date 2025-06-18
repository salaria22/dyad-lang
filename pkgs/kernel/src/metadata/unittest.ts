import { z } from "zod";

export const individualUnitTestSchema = z.object({
  solver: z.optional(
    z
      .enum(["DefaultODEAlgorithm", "Tsit5", "Rodas4", "FBDF"])
      .describe("solver to use when running test")
  ),
  start: z
    .number()
    .default(0.0)
    .describe("start time of simulation (optional, default is 0.0)"),
  stop: z.number().describe("experiment stop time"),
  params: z
    .optional(z.record(z.string(), z.any()).default({}))
    .describe("optional parameter values to use for a given experiment"),
  initial: z
    .optional(z.record(z.string(), z.number()).default({}))
    .describe("optional initial conditions"),
  // TODO: Allow specifying initial conditions (just as with experiment) but
  // also specify _outputs_ at time zero as well.
  // - base all tests off of experiments?
  // - have expect on the signal level (_e.g.,_ "expect": { "z": { "atol"=0.01, traj=[...], "initial": 10.0 } } )?
  atol: z
    .optional(z.record(z.string(), z.number()))
    .describe("Absolute tolerances to use for specific signals"),
  expect: z.optional(
    z.object({
      initial: z
        .optional(z.record(z.string(), z.any()))
        .describe("Expected initial values for specified signals"),
      final: z
        .optional(z.record(z.string(), z.any()))
        .describe("Expected final values for specified signals"),
      signals: z
        .optional(z.array(z.string()))
        .describe("List of signals to compare for snapshot tests"),
    })
  ),
});
export type IndividualUnitTestSchema = z.infer<typeof individualUnitTestSchema>;

export const unitTestsSchema = z.record(
  z.string().describe("test name"),
  individualUnitTestSchema
);
export type UnitTestsSchema = z.infer<typeof unitTestsSchema>;

export interface NormalizedIndividualUnitTest {
  solver: "DefaultODEAlgorithm" | "Tsit5" | "Rodas4" | "FBDF";
  start: number;
  stop: number;
  params: Record<string, any>;
  initial: Record<string, number>;
  atol: Record<string, number>;
  expect: {
    initial: Record<string, any>;
    final: Record<string, any>;
    signals: string[];
  };
}

export type NormalizedUnitTestsMetadata = Record<
  string,
  NormalizedIndividualUnitTest
>;

export function normalizeUnitTest(
  v: IndividualUnitTestSchema
): NormalizedIndividualUnitTest {
  const expect: NormalizedIndividualUnitTest["expect"] = v.expect
    ? {
        initial: v.expect.initial ?? {},
        final: v.expect.final ?? {},
        signals: v.expect.signals ?? [],
      }
    : {
        initial: {},
        final: {},
        signals: [],
      };
  return {
    ...v,
    solver: v.solver ?? "DefaultODEAlgorithm",
    start: v.start ?? 0.0,
    params: v.params ?? {},
    initial: v.initial ?? {},
    atol: v.atol ?? {},
    expect: expect,
  };
}

export function normalizeUnitTests(
  v: UnitTestsSchema
): NormalizedUnitTestsMetadata {
  return Object.fromEntries(
    Object.entries(v).map(([key, v]) => [key, normalizeUnitTest(v)])
  );
}
