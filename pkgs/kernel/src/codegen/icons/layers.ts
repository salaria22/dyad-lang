import { Problem, Result, partialResult } from "@juliacomputing/dyad-common";
import { ModelInstance } from "../../instantiate/model.js";
import {
  dyadDefinition,
  normalizeDefinition,
} from "../../metadata/definition.js";
import { labelGraphics } from "./component.js";
import { viewHeight, viewWidth } from "./constants.js";
import { getIcon } from "./icon.js";
import { renderLabel } from "./render.js";
import { QueryHandler } from "../../workspace/selector.js";

export async function connectorLayer(
  instance: ModelInstance,
  baserot: number,
  query: QueryHandler
): Promise<Result<string[]>> {
  const entries: string[] = [];
  const problems: Problem[] = [];
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
    ).ifResult((icon) => {
      const contents: string[] = [icon];
      const metadata = dyadDefinition
        .passthrough()
        .safeParse(comp.def.metadata ? comp.def.metadata.value : {});
      const norm = normalizeDefinition(metadata.success ? metadata.data : {});
      entries.push(
        `<g transform="translate(${(x1 + x2) / 2 - viewWidth / 2} ${
          (y1 + y2) / 2 - viewHeight / 2
        }) scale(${sw} ${sh}) rotate(${rot})" transform-origin="center center">${contents.join(
          "\n"
        )}</g>`
      );
      for (const label of labelGraphics(
        { ...instance.substitutions, instance: cn },
        norm,
        "icon"
      )) {
        entries.push(renderLabel(label, baserot));
      }
    }, problems);
  }

  return partialResult(entries, ...problems);
}
