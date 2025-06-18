import { z } from "zod";
import {
  NormalizedExperimentsMetadata,
  experimentsSchema,
  normalizeExperiments,
} from "./experiments.js";
import {
  NormalizedUnitTestsMetadata,
  normalizeUnitTests,
  unitTestsSchema,
} from "./unittest.js";
import { definitionIconsSchema, pathAttributesSchema } from "./icons.js";
import { defaultIcons } from "./default_icons.js";
import {
  NormalizedLabelMetadata,
  definitionLabelSchema,
  normalizeLabelMetadata,
} from "./labels.js";
import {
  docAttributesSchema,
  NormalizedDocMetadata,
  normalizeDocMetadata,
} from "./doc.js";

export const defaultLabels: Array<NormalizedLabelMetadata> = [
  { label: "$(instance)", x: 500, y: 1100, rot: 0, layer: "icon", attrs: {} },
];

/**
 * This is the metadata that can be associated with a definition (_i.e._ a
 * connector, model or type).
 */
export const dyadDefinition = z.object({
  Dyad: z.optional(
    z
      .object({
        experiments: experimentsSchema,
        tests: unitTestsSchema,
        labels: z.array(definitionLabelSchema),
        icons: definitionIconsSchema,
        path: pathAttributesSchema,
        doc: docAttributesSchema,
      })
      .partial()
      .describe(
        "Dyad metadata that can be associated with the definition of a model, type or connector"
      )
  ),
});
export type DyadDefinition = z.infer<typeof dyadDefinition>;

export interface NormalizedDyadDefinition {
  Dyad: {
    experiments: NormalizedExperimentsMetadata;
    tests: NormalizedUnitTestsMetadata;
    labels: Array<NormalizedLabelMetadata>;
    icons: Record<string, string>;
    path: Record<string, string>;
    doc: NormalizedDocMetadata;
  };
}

export function normalizeDefinition(
  v: DyadDefinition
): NormalizedDyadDefinition {
  const Dyad = v.Dyad
    ? {
        experiments: normalizeExperiments(v.Dyad.experiments ?? {}),
        tests: normalizeUnitTests(v.Dyad.tests ?? {}),
        icons: v.Dyad.icons ?? defaultIcons,
        labels: normalizeLabelMetadata(v.Dyad.labels ?? defaultLabels),
        path: v.Dyad.path ?? {},
        doc: normalizeDocMetadata(v.Dyad.doc ?? {}),
      }
    : {
        experiments: normalizeExperiments({}),
        tests: normalizeUnitTests({}),
        labels: defaultLabels,
        icons: defaultIcons,
        path: {},
        doc: { behavior: true },
      };
  return {
    ...v, // Preserves non-standard metadata
    Dyad: Dyad,
  };
}
