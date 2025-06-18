import { z } from "zod";

export const definitionIconsSchema = z
  .record(z.string(), z.string().url())
  .describe("List of icons and their associated resource locations");
export type DefinitionIconsSchema = z.infer<typeof definitionIconsSchema>;

export const pathAttributesSchema = z
  .record(z.string(), z.string())
  .describe("Attributes to use to SVG path for connections");
export type PathAttributesSchema = z.infer<typeof pathAttributesSchema>;

export const iconPlacementSchema = z.object({
  iconName: z
    .string()
    .default("default")
    .describe(`Icon name to use (if no value is given, "default" is used)`),
  x1: z
    .number()
    .describe("Left most x-coordinate of the bounding box for this icon"),
  y1: z
    .number()
    .describe("Top most y-coordinate of the bounding box for this icon"),
  x2: z
    .number()
    .describe("Right most x-coordinate of the bounding box for this icon"),
  y2: z
    .number()
    .describe("Bottom most y-coordinate of the bounding box for this icon"),
  rot: z
    .optional(z.number())
    .describe("Icon rotation in degrees (default is 0)"),
});
export type IconPlacementSchema = z.infer<typeof iconPlacementSchema>;

export const componentPlacementSchema = z.object({
  icon: z.optional(iconPlacementSchema),
  diagram: z.optional(iconPlacementSchema),
});
export type ComponentPlacementSchema = z.infer<typeof componentPlacementSchema>;

export interface NormalizedIconPlacement {
  iconName: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rot: number;
}

export interface NormalizedPlacement {
  icon?: NormalizedIconPlacement;
  diagram?: NormalizedIconPlacement;
}

export function normalizePlacement(
  v: ComponentPlacementSchema
): NormalizedPlacement {
  let icon: NormalizedIconPlacement | undefined = v.icon
    ? {
        ...v.icon,
        iconName: v.icon.iconName ?? "default",
        x1: v.icon.x1,
        x2:
          v.icon.x2 < v.icon.x1
            ? Math.min(v.icon.x1 - 20, v.icon.x2)
            : Math.max(v.icon.x1 + 20, v.icon.x2), // Prevent zero width
        y1: v.icon.y1,
        y2:
          v.icon.y2 < v.icon.y1
            ? Math.min(v.icon.y1 - 20, v.icon.y2)
            : Math.max(v.icon.y1 + 20, v.icon.y2), // Prevent zero height
        rot: v.icon.rot ?? 0,
      }
    : undefined;
  let diagram: NormalizedIconPlacement | undefined = v.diagram
    ? {
        ...v.diagram,
        iconName: v.diagram.iconName ?? "default",
        x1: v.diagram.x1,
        x2:
          v.diagram.x2 < v.diagram.x1
            ? Math.min(v.diagram.x1 - 20, v.diagram.x2)
            : Math.max(v.diagram.x1 + 20, v.diagram.x2), // Prevent zero width
        y1: v.diagram.y1,
        y2:
          v.diagram.y2 < v.diagram.y1
            ? Math.min(v.diagram.y1 - 20, v.diagram.y2)
            : Math.max(v.diagram.y1 + 20, v.diagram.y2), // Prevent zero height
        rot: v.diagram.rot ?? 0,
      }
    : icon
    ? { ...icon, rot: icon.rot ?? 0 }
    : undefined;

  return {
    icon,
    diagram,
  };
}
