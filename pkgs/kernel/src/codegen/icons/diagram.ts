import { QueryHandler } from "../../workspace/index.js";
import { diagramLayout } from "./layout.js";
import {
  renderComponent,
  renderConnection,
  renderDiagram,
  renderJunction,
  renderLabel,
} from "./render.js";
import { ModelInstance } from "../../instantiate/model.js";
import { toJS } from "mobx";
import { Result } from "@juliacomputing/dyad-common";

/**
 * The purpose of this function is to generate the icon "markup" for a given
 * model definition.  Currently, the assumption is that this "markup" is in
 * SVG although something like web components could be used here as well since
 * the assumption is that this will be injected into the DOM.
 *
 * @param def Definition whose icon is being requested
 * @param iconName The name of the icon to render (a given definition may have multiple)
 * @param workspace The workspace that this definition is managed in
 * @param visited The set of all model definitions already called (to avoid infinite recursion)
 * @returns
 */
export async function generateDiagram(
  instanceName: string,
  instance: ModelInstance,
  query: QueryHandler
): Promise<Result<string>> {
  const _def = toJS(query(instance.def));
  // Generate the layout of the components, connections and connectors.  This is just
  // information about the placement of all the icons and lines.
  return (await diagramLayout(instance, query)).map((layout) => {
    // Render the components
    const components = Object.values(layout.components).map((g) =>
      renderComponent(g, { filter: "url(#drop-shadow)" })
    );

    // Render the connections
    const connections = Object.values(layout.connections).map((g) =>
      renderConnection(g, g.pathAttrs)
    );

    // Render the connectors
    const connectors = Object.values(layout.connectors).map((g) =>
      renderComponent(g, {})
    );

    const junctions = layout.junctions.map((g) => renderJunction(g, {}));

    const labels = layout.labels.map((g) => renderLabel(g, 0));

    // Now wrap it all in an SVG wrapper
    return renderDiagram(
      instanceName,
      components,
      connections,
      connectors,
      junctions,
      labels
    );
  });
}
