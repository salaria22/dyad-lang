import { Lines } from "@juliacomputing/dyad-common";
import { NormalizedRenderOptions } from "./options.js";

export function renderIcon(
  lines: Lines,
  options: NormalizedRenderOptions,
  icon: string,
  iconName: string
) {
  lines.add(
    options.html(`
      <div style="float: right;width: 20%;max-width: 10vw; margin-left: 20px">
      ${icon}
      <span style="width: 100%; text-align: center; display:inline-block"><code>${iconName}</code> Icon</span>
      </div>
    `)
  );
}
