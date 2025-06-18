import { Problem, Result, partialResult } from "@juliacomputing/dyad-common";
import { ModelInstance } from "../../instantiate/model.js";
import { ComponentGraphic } from "./component.js";
import { getIcon } from "./icon.js";
import { QueryHandler } from "../../workspace/selector.js";

export async function connectorGraphics(
  instance: ModelInstance,
  query: QueryHandler
): Promise<Result<Record<string, ComponentGraphic>>> {
  const problems: Problem[] = [];
  const ret: Record<string, ComponentGraphic> = {};
  // Then inject the icon for all the connectors.
  // TODO: Parallelize this using Promise.all()
  for (const [cn, comp] of Object.entries(instance.connectors)) {
    const placement = comp.metadata.Dyad.placement;
    if (placement === undefined || placement.icon === undefined) {
      continue;
    }
    const x1 = placement.icon.x1;
    const y1 = placement.icon.y1;
    const x2 = placement.icon.x2;
    const y2 = placement.icon.y2;
    const w = x2 - x1;
    const sw = w / 1000;
    const h = y2 - y1;
    const sh = h / 1000;
    const rot = placement.icon.rot;
    (
      await getIcon(
        comp.def.name.value,
        comp.def,
        comp.def.metadata,
        placement.icon.iconName,
        query
      )
    ).ifResult((contents) => {
      const transform = { x1, x2, y1, y2, sw, sh, rot };
      const graphic: ComponentGraphic = {
        componentName: cn,
        transform,
        icon: contents,
      };
      ret[cn] = graphic;
    }, problems);
  }
  return partialResult(ret, ...problems);
}
