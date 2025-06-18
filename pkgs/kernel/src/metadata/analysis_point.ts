import { z } from "zod";

/**
 * This is the metadata that can be associated with a component (_i.e.,_ something)
 * that might appear on a schematic.
 */
export const dyadAnalysisPoint = z.object({
  Dyad: z
    .optional(z.object({}))
    .describe("Dyad metadata associated with a connection"),
});
export type DyadAnalysisPoint = z.infer<typeof dyadAnalysisPoint>;

export type NormalizedDyadAnalysisPoint = {
  Dyad: {};
};

export function normalizeAnalysisPoint(
  v: DyadAnalysisPoint
): NormalizedDyadAnalysisPoint {
  return {
    ...v,
    Dyad: {},
  };
}
