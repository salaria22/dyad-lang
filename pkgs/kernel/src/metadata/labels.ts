import { z } from "zod";

export const definitionLabelSchema = z.object({
  label: z.string(),
  x: z.number(),
  y: z.number(),
  rot: z.optional(z.number()).describe("Label rotation, in degrees"),
  layer: z.optional(z.enum(["icon", "diagram", "all"])),
  attrs: z
    .optional(z.record(z.string(), z.string()))
    .describe("Override text element attributes"),
});
export type DefinitionLabelSchema = z.infer<typeof definitionLabelSchema>;

export interface NormalizedLabelMetadata {
  label: string;
  x: number;
  y: number;
  rot: number;
  layer: "icon" | "diagram" | "all";
  attrs: Record<string, string>;
}

export function normalizeLabelMetadata(
  v: Array<DefinitionLabelSchema>
): Array<NormalizedLabelMetadata> {
  const ret: Array<NormalizedLabelMetadata> = [];

  for (const elem of v) {
    const norm = definitionLabelSchema.safeParse(elem);
    if (norm.success) {
      const base = norm.data;
      ret.push({
        label: base.label,
        x: base.x,
        y: base.y,
        rot: base.rot ?? 0,
        layer: base.layer ?? "icon", // By default text is only rendered on icons
        attrs: base.attrs ?? {},
      });
    } else {
      console.warn(
        "Parsing label metadata, incoming data didn't match schema, skipping: ",
        norm.error
      );
    }
  }
  return ret;
}
