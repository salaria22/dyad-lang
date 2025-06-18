import { z } from "zod";
import {
  NormalizedPlacement,
  componentPlacementSchema,
  normalizePlacement,
} from "./icons.js";
import { languageName } from "@juliacomputing/dyad-common";

/**
 * This is the metadata that can be associated with a component (_i.e.,_ something)
 * that might appear on a schematic.
 */
export const dyadComponent = z.object({
  Dyad: z
    .optional(
      z.object({
        placement: z.optional(componentPlacementSchema),
      })
    )
    .describe(
      `${languageName} metadata that can be associated with a component instance`
    ),
});
export type DyadComponent = z.infer<typeof dyadComponent>;

export interface NormalizedDyadComponent {
  Dyad: {
    placement?: NormalizedPlacement;
  };
}

export function normalizeComponent(v: DyadComponent): NormalizedDyadComponent {
  const Dyad: NormalizedDyadComponent["Dyad"] = {};
  if (v.Dyad?.placement) {
    Dyad.placement = normalizePlacement(v.Dyad.placement);
  }
  return {
    ...v, // Preserves non-standard metadata
    Dyad: Dyad,
  };
}
