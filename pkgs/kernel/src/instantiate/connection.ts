import {
  CompRef,
  Connection,
  DocString,
  expressionSpan,
  qualifiedName,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import {
  NormalizedDyadConnection,
  dyadConnection,
  normalizeConnection,
} from "../metadata/connection.js";
import {
  FailedResult,
  failedResult,
  Nullable,
  partialResult,
  Problem,
  Result,
} from "@juliacomputing/dyad-common";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import type { ModelInstance } from "./model.js";
import { incompatibleConnectorTypes, invalidConnection } from "./errors.js";
import { walkInstance } from "./walk.js";
import { unparseExpression } from "@juliacomputing/dyad-parser";
import type {
  ScalarConnectorInstance,
  StructConnectorInstance,
} from "./connector.js";
import {
  dyadDefinition,
  normalizeDefinition,
  NormalizedDyadDefinition,
} from "../metadata/definition.js";
import { zodIssue2Problem } from "../metadata/issues.js";
import type { ResolvedType } from "../workspace/types/types.js";
import { problemSpan } from "../workspace/utils.js";
import type { QueryHandler } from "../workspace/selector.js";
import type { DefinitionEntity } from "../workspace/index.js";
import type { RelationInstance } from "./relations.js";
import type { InstanceContext } from "./context.js";

type Connectable = ScalarConnectorInstance | StructConnectorInstance;

export type SemanticQualifier = "output" | "input" | "undefined";

export interface ConnectionInstance {
  doc_string: Nullable<DocString>;
  kind: Connectable["kind"];
  /** Connector metadata, if any (will be empty for variables) */
  connectorMetadata: NormalizedDyadDefinition;
  type: ResolvedType;
  qualifiers: SemanticQualifier[];
  connectors: CompRef[];
  span: Nullable<TextualSpan>;
  index: number;
  origin: DefinitionEntity;
  metadata: NormalizedDyadConnection;
  metadataSpan: Nullable<TextualSpan>;
  connectSpan: Nullable<TextualSpan>;
}

export function isConnectionInstance(
  rel: RelationInstance
): rel is ConnectionInstance {
  return rel.kind === "sclcon" || rel.kind === "strcon";
}

const issueMap = zodIssue2Problem("instantiateConnection", "condef");

/**
 * Instantiate a connection
 * @param instance The model instance this connection belongs to
 * @param con The Connection ASTNode we are instantiating
 * @returns either a Problem or a ConnectionInstance
 */
export function instantiateConnection(
  query: QueryHandler,
  instance: ModelInstance,
  con: Connection,
  ictxt: InstanceContext
): Result<ConnectionInstance> {
  /** Use this to hold the type of all the connectors in the connection set */
  let contype: Maybe<Connectable> = Nothing;
  const def = query(instance.def);

  /** Start by ensuring there are at least two connectors in this connection */
  if (con.connectors.length < 2) {
    return failedResult(
      invalidConnection(
        instance.name.value,
        `Found connection that references only ${con.connectors.length} connectors`,
        problemSpan(def, con.span)
      )
    );
  }

  /** Create a list of problems we encounter */
  const problems: Problem<unknown>[] = [];

  const qualifiers: SemanticQualifier[] = [];
  /** Iterate over all connectors and resolve information about the connector */
  for (let i = 0; i < con.connectors.length; i++) {
    /** Extract the connector reference */
    const conref = con.connectors[i];
    /** Formulate the string version of this component reference */
    const cn = unparseExpression(conref);

    /** Resolve the component reference to an instance */
    const cinst = walkInstance(instance, def, conref, query);

    /** If there was an error resolving this, just return the error directly */
    if (cinst instanceof FailedResult) {
      return cinst;
    }

    qualifiers[i] = "undefined";

    /** If we got an instance for this component reference... */
    cinst.ifResult((ci) => {
      if (ci.kind === "sclcon") {
        qualifiers[i] = ci.def.qualifier;
      }
      if (ci.kind === "sclcon" || ci.kind === "strcon") {
        contype.caseOf({
          Just: (actual) => {
            /** check these connectors are actually compatible with each other */
            const issue = compatibleConnectorTypes(actual, ci);
            if (issue.isJust()) {
              throw incompatibleConnectorTypes(
                cn,
                issue.unsafeCoerce(),
                problemSpan(def, expressionSpan(conref))
              );
            }
          },
          Nothing: () => {
            contype = Just(ci);
          },
        });
      } else {
        throw incompatibleConnectorTypes(
          cn,
          `Expected ${cn} to be a connector but it was a ${ci.kind}`,
          problemSpan(def, expressionSpan(conref))
        );
      }
    }, problems);
  }

  if (contype.isNothing()) {
    return failedResult(problems[0], ...problems.slice(1));
  }
  const ctype = contype.unsafeCoerce();
  let metadata: NormalizedDyadConnection = { Dyad: {} };
  if (con.metadata !== null) {
    const parsed = dyadConnection.safeParse(con.metadata.value);
    if (parsed.success) {
      const norm = normalizeConnection(parsed.data);
      metadata = norm;
    }
  }

  let connectorMetadata: NormalizedDyadDefinition = normalizeDefinition({});
  const cmeta = dyadDefinition.safeParse(ctype.def.metadata?.value ?? {});
  if (cmeta.success) {
    connectorMetadata = normalizeDefinition(cmeta.data);
  } else {
    problems.push(
      ...cmeta.error.issues.map((x) =>
        issueMap(x, problemSpan(ctype.def, ctype.def.metadata?.span ?? null))
      )
    );
  }
  const inst: ConnectionInstance = {
    kind: contype.unsafeCoerce().kind,
    doc_string: con.doc_string,
    type: ctype.type,
    qualifiers,
    connectorMetadata,
    connectors: con.connectors,
    span: con.span,
    ...ictxt,
    metadata: metadata,
    metadataSpan: con.metadata?.span ?? null,
    connectSpan: con.span,
  };
  return partialResult(inst, ...problems);
}

/**
 * This function determines if the two `Connectable` instances are compatible.
 * If they are compatible, it returns `Nothing`.  If they are not compatible, it
 * returns a string describing why they are not compatible.
 *
 * @param a
 * @param b
 * @returns Nothing if no issue found, Just(string) if an issue was found
 */
export function compatibleConnectorTypes(
  a: Connectable,
  b: Connectable
): Maybe<string> {
  /** If they are both struct connectors... */
  if (a.kind === "strcon" && b.kind === "strcon") {
    /** Ensure they have a common connector definition */
    if (a.def === b.def) {
      return Nothing;
    }
    return Just(
      `Connectors ${a.name.value} and ${b.name.value} do not have a common connector definition`
    );
  }

  /** If they are scalar connectors... */
  if (a.kind === "sclcon" && b.kind === "sclcon") {
    /** Ensure the base type is the same (ignore input and output...for now) */
    if (qualifiedName(a.type.def.type) === qualifiedName(b.type.def.type)) {
      return Nothing;
    }
    return Just(
      `Connectors ${a.name.value} and ${b.name.value} do not have a common connector definition`
    );
  }

  return Just(
    `Incompatible connectors (unhandled case ${a.kind} and ${b.kind})`
  );
}
