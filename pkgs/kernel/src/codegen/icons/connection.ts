import { Either, Left, Right } from "purify-ts/Either";
import {
  CompRef,
  Deref,
  expressionSpan,
  FileLevelNode,
  ProblemSpan,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import { DyadWayPoint } from "../../metadata/connection.js";
import { viewHeight, viewWidth } from "./constants.js";
import {
  Problem,
  problemError,
  Result,
  partialResult,
  bundledProblems,
  Nullable,
} from "@juliacomputing/dyad-common";
import { ModelInstance } from "../../instantiate/model.js";
import { ComponentInstance } from "../../instantiate/component.js";
import { NormalizedIconPlacement } from "../../metadata/icons.js";
import { problemSpan } from "../../workspace/utils.js";
import { isConnectionInstance } from "../../index.js";
import { CompilerAssertionError } from "../../workspace/errors.js";

const InvalidReference = problemError<ProblemSpan>(
  "invalid-reference",
  "Invalid Connector Reference"
);

const MissingMetadata = problemError<ProblemSpan>(
  "missing-metadata",
  "Missing metadata"
);

const InvalidEndpoint = problemError<ProblemSpan>(
  "invalid-endpoint",
  "Invalid endpoint"
);

export interface ConnectionSetGraphics {
  routes: Record<string, ConnectionGraphic>;
  junctions: JunctionGraphic[];
}

export function connectionGraphics(
  instance: ModelInstance,
  file: FileLevelNode
): Result<ConnectionSetGraphics> {
  const ret: Record<string, ConnectionGraphic> = {};
  return routeSegments(instance, file).map(({ routes, junctions }) => {
    for (let i = 0; i < routes.length; i++) {
      const segment = routes[i];
      ret[`segment${i}`] = {
        path: [segment.from, ...segment.route, segment.to],
        pathAttrs: segment.pathAttrs,
      };
    }
    return { routes: ret, junctions };
  });
}

export interface RouteSegment {
  pathAttrs: Record<string, string>;
  from: DyadWayPoint;
  to: DyadWayPoint;
  route: DyadWayPoint[];
}

export interface ConnectionGraphic {
  pathAttrs: Record<string, string>;
  path: DyadWayPoint[];
}

export interface JunctionGraphic {
  color: string;
  location: DyadWayPoint;
}

function resolveEnd(
  instance: ModelInstance,
  index: number,
  junctions: DyadWayPoint[],
  connectors: CompRef[],
  metadataSpan: Nullable<TextualSpan>,
  file: FileLevelNode
): Either<Problem, DyadWayPoint> {
  if (index === 0) {
    return Left(
      InvalidEndpoint(
        `${index}`,
        `invalid index of 0`,
        problemSpan(file, metadataSpan)
      )
    );
  }
  if (index < 0 && -index > junctions.length) {
    return Left(
      InvalidEndpoint(
        `junction:${-index}`,
        `references junction ${-index} but there are only ${
          junctions.length
        } junctions`,
        problemSpan(file, metadataSpan)
      )
    );
  }
  if (index > 0 && index > connectors.length) {
    return Left(
      InvalidEndpoint(
        `connector:${index}`,
        `references connector ${index} but there are only ${connectors.length} connectors in this connection`,
        problemSpan(file, metadataSpan)
      )
    );
  }
  if (index < 0) {
    return Right(junctions[-index - 1]);
  }
  return getLocation(instance, connectors[index - 1], file);
}

export interface RoutesAndJunctions {
  routes: RouteSegment[];
  junctions: JunctionGraphic[];
}

export function routeSegments(
  instance: ModelInstance,
  file: FileLevelNode
): Result<RoutesAndJunctions> {
  const routes: RouteSegment[] = [];
  const junctions: JunctionGraphic[] = [];
  const problems: Problem[] = [];
  const connections = instance.relations.filter(isConnectionInstance);
  for (let cn = 0; cn < connections.length; cn++) {
    const con = connections[cn];
    const edges = con.metadata.Dyad.edges ?? [];
    const waypoints = con.metadata.Dyad.junctions ?? [];
    const pathAttrs = con.connectorMetadata.Dyad?.path ?? {};
    for (let en = 0; en < edges.length; en++) {
      const edge = edges[en];
      const start = resolveEnd(
        instance,
        edge.S,
        waypoints,
        con.connectors,
        con.metadataSpan,
        file
      );
      const end = resolveEnd(
        instance,
        edge.E,
        waypoints,
        con.connectors,
        con.metadataSpan,
        file
      );
      problems.push(...Either.lefts([start, end]));
      Either.sequence([start, end]).ifRight(([from, to]) => {
        routes.push({ from, to, route: edge.M ?? [], pathAttrs });
      });
    }
    for (let jn = 0; jn < waypoints.length; jn++) {
      junctions.push({
        color: pathAttrs["stroke"] ?? "black",
        location: waypoints[jn],
      });
    }
  }

  return partialResult({ routes, junctions }, ...problems);
}

/**
 * Given a model instance, extract the `ComponentInstance` for the named component
 *
 * @param instance The model instance to search
 * @param subcomponentReference the component being searched for
 * @returns Either a problem or the component instance
 */
export function resolveComponentReference(
  instance: ModelInstance,
  subcomponentReference: Deref,
  span: ProblemSpan
): Either<Problem, ComponentInstance> {
  if (subcomponentReference.indices.length !== 0) {
    return Left(
      InvalidReference(
        subcomponentReference.name,
        `Reference to subcomponent ${subcomponentReference.name} in model ${instance.name.value} includes array dereferences.`,
        span
      )
    );
  }
  const subname = subcomponentReference.name;
  const subcomponent = instance.components[subname];
  if (subcomponent === undefined) {
    return Left(
      InvalidReference(
        subname,
        `Connector references component ${subname} which doesn't exist in model ${instance.name.value}`,
        span
      )
    );
  }
  const subr = subcomponent();
  return subr.caseOf({
    errors: (e) =>
      Left(
        bundledProblems(
          subname,
          `subcomponent ${subname} could not be fully instantiated`,
          [e[0], ...e.slice(1)]
        )
      ),
    warnings: (_, e) =>
      Left(
        bundledProblems(
          subname,
          `subcomponent ${subname} could not be fully instantiated`,
          [e[0], ...e.slice(1)]
        )
      ),
    success: (v) => Right(v),
  });
}

/**
 * Resolve the placement information for a given subcomponent in the provided `ModelInstance`
 *
 * @param instance The model instance
 * @param subcomponentReference The name of the subcomponent referenced
 * @param subcomponent The resolved `ComponentInstance` for that subcomponent reference
 * @returns Either a problem or the normalized icon placement
 */
export function resolveComponentPlacement(
  instance: ModelInstance,
  subcomponentReference: Deref,
  subcomponent: ComponentInstance,
  span: ProblemSpan
): Either<Problem, NormalizedIconPlacement> {
  const componentPlacement = subcomponent.metadata.Dyad.placement?.diagram;
  if (componentPlacement === undefined) {
    return Left(
      MissingMetadata(
        subcomponentReference.name,
        `Component ${subcomponentReference.name} is ${instance.name.value} doesn't include placement metadata for diagrams`,
        span
      )
    );
  }
  return Right(componentPlacement);
}

/**
 * Resolve the placement of a connector on a subcomponent instantiated inside a model
 * @param instance The model instance
 * @param connectorReference The reference to the connector on the subcomponent
 * @returns Either a problem or the normalized icon placement of the connector on the subcomponent
 */
export function resolveConnectorPlacement(
  instance: ModelInstance,
  connectorReference: Deref,
  span: ProblemSpan
): Either<Problem, NormalizedIconPlacement> {
  if (connectorReference.indices.length !== 0) {
    return Left(
      InvalidReference(
        connectorReference.name,
        `Reference to connector ${connectorReference.name} in model ${instance.name.value} includes array dereferences.`,
        span
      )
    );
  }

  const meta = instance.connectors[connectorReference.name].metadata;

  if (meta === undefined) {
    return Left(
      InvalidReference(
        instance.name.value,
        `Reference to connector ${connectorReference.name} which doesn't exist in model ${instance.name.value}`,
        span
      )
    );
  }

  const connectorPlacement = meta.Dyad.placement?.icon;
  if (connectorPlacement === undefined) {
    const path = `${connectorReference.name}`;
    return Left(
      MissingMetadata(
        path,
        `No placement metadata found for connector ${path} on model ${instance.name.value}`,
        span
      )
    );
  }
  return Right(connectorPlacement);
}

/**
 * Resolve the placement of a connector on a subcomponent instantiated inside a model
 * @param instance The model instance
 * @param connectorReference The reference to the connector on the subcomponent
 * @param subcomponentReference The reference to the subcomponent
 * @param subcomponent The `ComponentInstance` of the subcomponent
 * @returns Either a problem or the normalized icon placement of the connector on the subcomponent
 */
export function resolveSubcomponentConnectorPlacement(
  instance: ModelInstance,
  connectorReference: Deref,
  subcomponentReference: Deref,
  subcomponent: ComponentInstance,
  span: ProblemSpan
): Either<Problem, NormalizedIconPlacement> {
  if (connectorReference.indices.length !== 0) {
    return Left(
      InvalidReference(
        connectorReference.name,
        `Reference to connector ${connectorReference.name} on subcomponent ${subcomponentReference.name} in model ${instance.name.value} includes array dereferences.`,
        span
      )
    );
  }

  const meta = subcomponent.connectorMetadata[connectorReference.name];

  if (meta === undefined) {
    return Left(
      InvalidReference(
        subcomponentReference.name,
        `Connector references component ${subcomponentReference.name} which doesn't exist in model ${connectorReference.name}`,
        span
      )
    );
  }

  const connectorPlacement = meta.Dyad.placement?.icon;
  if (connectorPlacement === undefined) {
    const path = `${subcomponentReference.name}.${connectorReference.name}`;
    return Left(
      MissingMetadata(
        path,
        `No placement metadata found for connector ${path} on model ${instance.name.value}`,
        span
      )
    );
  }
  return Right(connectorPlacement);
}

/**
 * Get the location of a connector on a subcomponent in the current model instance
 * @param instance The model instance
 * @param ref A reference to a connector on a subcomponent
 * @returns Either a problem or a DyadWayPoint
 */
export function getLocation(
  instance: ModelInstance,
  ref: CompRef,
  file: FileLevelNode
): Either<Problem, DyadWayPoint> {
  if (ref.elems.length === 1) {
    const span = problemSpan(file, expressionSpan(ref));
    return resolveConnectorPlacement(instance, ref.elems[0], span).map(
      (componentPlacement) => {
        // Width and height of subcomponent that has the connector we are connecting to
        const cw = componentPlacement.x2 - componentPlacement.x1;
        const ch = componentPlacement.y2 - componentPlacement.y1;
        const rot = (Math.PI * componentPlacement.rot) / 180;

        // Upper left corner of the subcomponent that has this connector
        const lx = componentPlacement.x1;
        const ly = componentPlacement.y1;

        // Center of the component (needed for rotation later)
        const cx = (componentPlacement.x2 + componentPlacement.x1) / 2.0;
        const cy = (componentPlacement.y2 + componentPlacement.y1) / 2.0;

        const x = lx + (cx / viewWidth) * cw;
        const y = ly + (cy / viewHeight) * ch;

        const dx = x - cx;
        const dy = y - cy;

        const c = Math.cos(rot);
        const s = Math.sin(rot);

        const rx = dx * c - dy * s + cx;
        const ry = dx * s + dy * c + cy;

        return {
          x: rx,
          y: ry,
        };
      }
    );
  } else if (ref.elems.length === 2) {
    const subcomponentReference = ref.elems[0];
    const connectorReference = ref.elems[1];
    const span = problemSpan(file, subcomponentReference.span);
    return resolveComponentReference(
      instance,
      subcomponentReference,
      span
    ).chain((subcomponent) => {
      return resolveComponentPlacement(
        instance,
        subcomponentReference,
        subcomponent,
        span
      ).chain((componentPlacement) => {
        return resolveSubcomponentConnectorPlacement(
          instance,
          connectorReference,
          subcomponentReference,
          subcomponent,
          span
        ).map((connectorPlacement) => {
          // Width and height of subcomponent that has the connector we are connecting to
          const cw = componentPlacement.x2 - componentPlacement.x1;
          const ch = componentPlacement.y2 - componentPlacement.y1;
          const rot = (Math.PI * componentPlacement.rot) / 180;

          // Upper left corner of the subcomponent that has this connector
          const lx = componentPlacement.x1;
          const ly = componentPlacement.y1;

          // Center of the component (needed for rotation later)
          const cx = (componentPlacement.x2 + componentPlacement.x1) / 2.0;
          const cy = (componentPlacement.y2 + componentPlacement.y1) / 2.0;

          // Location of the center of the connector is the coordinate system of the subcomponent
          const centerX = (connectorPlacement.x1 + connectorPlacement.x2) / 2;
          const centerY = (connectorPlacement.y1 + connectorPlacement.y2) / 2;

          const x = lx + (centerX / viewWidth) * cw;
          const y = ly + (centerY / viewHeight) * ch;

          const dx = x - cx;
          const dy = y - cy;

          const c = Math.cos(rot);
          const s = Math.sin(rot);

          const rx = dx * c - dy * s + cx;
          const ry = dx * s + dy * c + cy;

          return {
            x: rx,
            y: ry,
          };
        });
      });
    });
  } else {
    const espan = expressionSpan(ref);
    return Left(
      new CompilerAssertionError(
        instance.name.value,
        `Expected connector reference with two elements, found one with ${ref.elems.length}`,
        problemSpan(file, espan)
      )
    );
  }
}
