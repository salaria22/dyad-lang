import { z } from "zod";

export const docAttributesSchema = z.object({
  behavior: z.optional(
    z
      .boolean()
      .default(true)
      .describe(
        "suppress generation of behavior section (which shows equations)"
      )
  ),
});

export type DocAttributesSchema = z.infer<typeof docAttributesSchema>;

export interface NormalizedDocMetadata {
  behavior: boolean;
}

export function normalizeDocMetadata(
  v: DocAttributesSchema
): NormalizedDocMetadata {
  return {
    behavior: v.behavior ?? true,
  };
}
