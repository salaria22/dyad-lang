import { ModelInstance } from "../../instantiate/model.js";
import {
  ComponentGraphic,
  LabelGraphic,
  componentGraphics,
  labelGraphics,
} from "./component.js";
import {
  ConnectionGraphic,
  JunctionGraphic,
  connectionGraphics,
} from "./connection.js";
import { connectorGraphics } from "./connector.js";
import { partialResult, Problem, Result } from "@juliacomputing/dyad-common";
import { QueryHandler } from "../../workspace/selector.js";

export interface GraphicalLayout {
  kind: "icon" | "diagram";
  components: Record<string, ComponentGraphic>;
  connectors: Record<string, ComponentGraphic>;
  connections: Record<string, ConnectionGraphic>;
  junctions: JunctionGraphic[];
  labels: LabelGraphic[];
}

export async function diagramLayout(
  instance: ModelInstance,
  query: QueryHandler
): Promise<Result<GraphicalLayout>> {
  const problems: Problem[] = [];
  const ret: GraphicalLayout = {
    kind: "diagram",
    components: {},
    connectors: {},
    connections: {},
    junctions: [],
    labels: [],
  };

  const def = query(instance.def);
  // Put in instantiate model?
  const substitutions: Record<string, string> = {
    instance: instance.name.value,
  };

  ret.components = await componentGraphics(instance, query);
  connectionGraphics(instance, def).ifResult((cg) => {
    ret.connections = cg.routes;
    ret.junctions = cg.junctions;
  }, problems);
  (await connectorGraphics(instance, query)).ifResult((cg) => {
    ret.connectors = cg;
  }, problems);
  ret.labels = labelGraphics(
    substitutions,
    instance.definition_metadata,
    "diagram"
  );

  return partialResult(ret, ...problems);
}
