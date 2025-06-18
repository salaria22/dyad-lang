import { z } from "zod";

const dyadWayPoint = z.object({ x: z.number(), y: z.number() });
export type DyadWayPoint = z.infer<typeof dyadWayPoint>;

const dyadEdge = z.object({
  S: z
    .number()
    .describe(
      "This is the index of the start of the edge (negative indices are junctions, positive indices are connectors)"
    ),
  M: z
    .optional(z.array(dyadWayPoint))
    .describe("An array of 'midpoints' between the two ends"),
  E: z
    .number()
    .describe(
      "This is the index of the start of the edge (negative indices are junctions, positive indices are connectors)"
    ),
});
export type DyadEdge = z.infer<typeof dyadEdge>;

/**
 * This is the metadata that can be associated with a component (_i.e.,_ something)
 * that might appear on a schematic.
 */
export const dyadConnection = z.object({
  Dyad: z
    .optional(
      z.object({
        edges: z
          .optional(z.array(dyadEdge))
          .describe("Describes edges connecting connectors to junctions"),
        junctions: z
          .optional(z.array(dyadWayPoint))
          .describe("A list of junction locations"),
      })
    )
    .describe("Dyad metadata associated with a connection"),
});
export type DyadConnection = z.infer<typeof dyadConnection>;

export type NormalizedDyadConnection = {
  Dyad: {
    edges?: Array<Required<DyadEdge>>;
    junctions?: Array<DyadWayPoint>;
  };
};

export function normalizeConnection(
  v: DyadConnection
): NormalizedDyadConnection {
  const Dyad: NormalizedDyadConnection["Dyad"] = {};
  if (v.Dyad?.edges && Array.isArray(v.Dyad.edges)) {
    const edges = normalizeEdges(v.Dyad.edges);
    if (edges !== undefined) {
      Dyad.edges = edges;
    }
  }
  if (v.Dyad?.junctions && Array.isArray(v.Dyad.junctions)) {
    const junctions = normalizeJunctions(v.Dyad.junctions);
    if (junctions !== undefined) {
      Dyad.junctions = junctions;
    }
  }
  return {
    ...v, // Preserves non-standard metadata
    Dyad: Dyad,
  };
}

function normalizeEdges(v: Array<any>) {
  const ret: Array<Required<DyadEdge>> = [];

  for (const elem of v) {
    const norm = dyadEdge.safeParse(elem);
    if (norm.success) {
      ret.push({ ...norm.data, M: norm.data.M ?? [] });
    } else {
      return undefined;
    }
  }
  return ret;
}

function normalizeJunctions(v: Array<any>): Array<DyadWayPoint> | undefined {
  const ret: Array<DyadWayPoint> = [];
  for (const elem of v) {
    const norm = dyadWayPoint.safeParse(elem);
    if (norm.success) {
      ret.push(norm.data);
    } else {
      return undefined;
    }
  }
  return ret;
}
