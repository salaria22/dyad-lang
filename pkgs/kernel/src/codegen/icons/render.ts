import { ComponentGraphic, LabelGraphic } from "./component.js";
import { ConnectionGraphic, JunctionGraphic } from "./connection.js";
import { viewHeight, viewWidth } from "./constants.js";
import { svgFilters } from "./filters.js";
import { transformAttr } from "./transform.js";

export function renderComponent(
  graphic: ComponentGraphic,
  attrs: Record<string, string>
): string {
  const astr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<g ${astr} transform="${transformAttr(
    graphic.transform
  )}" transform-origin="center center">${graphic.icon}</g>`;
}

export function renderJunction(
  graphic: JunctionGraphic,
  attrs: Record<string, string>
): string {
  const astr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `    <circle cx="${graphic.location.x}" cy="${graphic.location.y}" r="5" fill="${graphic.color}" ${astr}/>`;
}

export function renderConnection(
  graphic: ConnectionGraphic,
  attrs: Record<string, string>
): string {
  // Define a default stroke color if one wasn't provided.
  if (attrs["stroke"] === undefined) {
    attrs["stroke"] = "black";
  }
  const astr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `    <path d="${graphic.path
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(
      " "
    )} " stroke-stroke="4" fill="transparent" ${astr} vector-effect="non-scaling-stroke"/>`;
}

export function renderLabel(label: LabelGraphic, baserot: number): string {
  const astr = Object.entries(label.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const inverted = baserot % 360 < -90 || baserot % 360 > 90;
  const rot = inverted ? label.rot + 180 : label.rot;

  return `    <text x="${label.location.x}" y="${
    label.location.y
  }" transform="rotate(${rot}, ${label.location.x - 500}, ${
    label.location.y - 500
  })" ${astr}>${label.text}</text>`;
}

export function renderDiagram(
  instanceName: string,
  components: string[],
  connections: string[],
  connectors: string[],
  junctions: string[],
  labels: string[]
): string {
  const ret = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${viewWidth} ${viewHeight}"
    overflow="visible" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
      <defs>
${svgFilters.join("\n")}
      </defs>
    ${[
      ...components,
      ...connections,
      ...connectors,
      ...junctions,
      ...labels,
    ].join("\n")}
      </svg>`;
  return ret.replace("$(instance)", instanceName);
}
