import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { ComponentInstance } from "../../instantiate/component.js";
import { viewHeight, viewWidth } from "./constants.js";
import { generateIcon } from "./icon.js";
import { DyadWayPoint } from "../../metadata/connection.js";
import { Transformation } from "./transform.js";
import { ModelInstance } from "../../instantiate/model.js";
import { NormalizedDyadDefinition } from "../../metadata/index.js";
import { unparseMTKExpression } from "../equation.js";
import { Problem, Result, successfulResult } from "@juliacomputing/dyad-common";
import { ComponentDefinition, hasExpression } from "@juliacomputing/dyad-ast";
import { QueryHandler } from "../../workspace/selector.js";

export interface ComponentGraphic {
  componentName: string;
  transform: Transformation;
  icon: string;
}

export interface LabelGraphic {
  text: string;
  rot: number;
  location: DyadWayPoint;
  attrs: Record<string, string>;
}

export async function componentGraphics(
  instance: ModelInstance,
  query: QueryHandler
): Promise<Record<string, ComponentGraphic>> {
  const ret: Record<string, ComponentGraphic> = {};
  // Inject icons for all subcomponents
  // TODO: Optimize this so async calls are concurrent
  const problems: Problem[] = [];
  for (const [cn, comp] of Object.entries(instance.components)) {
    await comp().ifAsyncResult(async (compi) => {
      const def = query(compi.instance.def);
      (await componentGraphic(cn, compi, def, query)).map((graphic) => {
        graphic.ifJust((g) => (ret[cn] = g));
      });
    }, problems);
  }
  return ret;
}

export async function componentGraphic(
  componentName: string,
  comp: ComponentInstance,
  cdef: ComponentDefinition,
  query: QueryHandler
): Promise<Result<Maybe<ComponentGraphic>>> {
  const placement = comp.metadata.Dyad.placement;
  if (placement === undefined || placement.diagram === undefined) {
    return successfulResult(Nothing);
  }
  const diagram = placement.diagram;
  const subs: Record<string, string> = { instance: componentName };
  for (const [key, val] of Object.entries(comp.mods)) {
    if (hasExpression(val)) {
      subs[key] = unparseMTKExpression(val.expr);
    }
  }
  return (
    await generateIcon(subs, cdef, diagram.iconName, diagram.rot, query)
  ).map((icon) => {
    const x1 = diagram.x1;
    const y1 = diagram.y1;
    const x2 = diagram.x2;
    const y2 = diagram.y2;
    const w = x2 - x1;
    const sw = w / viewWidth;
    const h = y2 - y1;
    const sh = h / viewHeight;
    const rot = diagram.rot;
    const transform = { x1, x2, y1, y2, sw, sh, rot };

    return Just({
      componentName,
      transform,
      icon,
    });
  });
}

export function labelGraphics(
  substitutions: Record<string, string>,
  metadata: NormalizedDyadDefinition,
  layer: "icon" | "diagram"
): LabelGraphic[] {
  const ret: LabelGraphic[] = [];

  for (const label of metadata.Dyad.labels) {
    if (label.layer === layer || label.layer === "all") {
      let text = label.label;
      for (const [v, sub] of Object.entries(substitutions)) {
        text = text.replaceAll(`$(${v})`, sub);
      }

      // These are the default values, potentially overridden by the
      const attrs: Record<string, string> = {
        fill: "black",
        "font-size": "200",
        "font-weight": "200",
        "dominant-baseline": "central",
        "text-anchor": "middle",
      };
      ret.push({
        text,
        rot: label.rot,
        location: { x: label.x, y: label.y },
        attrs: { ...attrs, ...label.attrs },
      });
    }
  }
  return ret;
}
