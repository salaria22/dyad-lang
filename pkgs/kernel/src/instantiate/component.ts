import {
  ComponentDefinition,
  Modifications,
  ConnectorDefinition,
  Expression,
  Indices,
  ComponentDeclaration,
} from "@juliacomputing/dyad-ast";
import {
  Nullable,
  Problem,
  Result,
  partialResult,
} from "@juliacomputing/dyad-common";
import {
  NormalizedDyadComponent,
  dyadComponent,
  normalizeComponent,
} from "../metadata/index.js";
import {
  componentType,
  mobxClone,
  problemSpan,
  QueryHandler,
  ResolvedComponentType,
} from "../workspace/index.js";
import { zodIssue2Problem } from "../metadata/issues.js";
import { instantiateModel, ModelInstance } from "./model.js";
import debug from "debug";

const compLog = debug("inst:comp");

export interface ComponentInstance {
  kind: "comp";
  typename: string;
  mods: Modifications;
  instance: ModelInstance;
  connectorDefinition: Record<string, ConnectorDefinition>;
  connectorMetadata: Record<string, NormalizedDyadComponent>;
  metadata: NormalizedDyadComponent;
  type: ResolvedComponentType;
  dims: Array<Expression>;
  indices: Indices;
  cond: Nullable<Expression>;
}

const issueMap = zodIssue2Problem("instantiateComponent", "component");

export function instantiateComponent(
  compdef: ComponentDefinition,
  decl: ComponentDeclaration,
  query: QueryHandler
): Result<ComponentInstance> {
  const instanceModifications = mobxClone(decl.instance.mods) || {};
  // const instanceModifications = objectMap(decl.instance.mods ?? {}, mobxClone);
  const instanceMetadata = decl.metadata;
  return instantiateModel(
    compdef,
    instanceModifications,
    instanceMetadata,
    query
  ).chain(
    // NB - Doesn't this lead to a full recursion of the instance hierarchy? Not
    // sure this will scale.  We may need to refactor to curtail full recursion.

    (instance) => {
      const problems: Problem[] = [];
      // We use passthrough to preserve non-standard metadata
      const metadata = dyadComponent
        .passthrough()
        .safeParse(instanceMetadata ? instanceMetadata.value : {});
      if (!metadata.success) {
        problems.push(
          ...metadata.error.issues.map((x) =>
            issueMap(x, problemSpan(compdef, instanceMetadata?.span ?? null))
          )
        );
      }
      const norm = normalizeComponent(metadata.success ? metadata.data : {});

      const connectorDefinition: Record<string, ConnectorDefinition> =
        Object.fromEntries(
          Object.entries(instance.connectors).map(([cn, conn]) => [
            cn,
            conn.def,
          ])
        );
      const connectorMetadata: Record<string, NormalizedDyadComponent> =
        Object.fromEntries(
          Object.entries(instance.connectors).map(([cn, conn]) => [
            cn,
            conn.metadata,
          ])
        );

      compLog("Instantiation model %s as component", compdef.name.value);

      const ret: ComponentInstance = {
        kind: "comp",
        typename: compdef.name.value,
        instance: instance,
        mods: instanceModifications,
        metadata: norm,
        type: componentType(compdef),
        connectorDefinition,
        connectorMetadata,
        dims: decl.dims.map(mobxClone),
        indices: decl.indices.map(mobxClone),
        cond: decl.cond ? mobxClone(decl.cond) : null,
      };
      return partialResult(ret, ...problems);
    }
  );
}
