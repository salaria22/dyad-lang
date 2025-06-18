import { z } from "zod";

/**
 * This is the metadata that can be associated with a variable.
 */
export const dyadDeclaration = z.object({
  Dyad: z
    .optional(z.object({}))
    .describe(
      "Dyad metadata that can be associated with a variable declaration"
    ),
});

export type DyadDeclaration = z.infer<typeof dyadDeclaration>;

export interface NormalizedDyadDeclaration {
  Dyad: {};
}

export function normalizeDeclaration(
  v: DyadDeclaration
): NormalizedDyadDeclaration {
  return {
    ...v, // Preserves non-standard metadata
    Dyad: v.Dyad ?? {},
  };
}
