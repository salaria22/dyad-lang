import type {
  ConnectionVariableDeclaration,
  ConnectorDefinition,
  ConnectorVariableQualifiers,
  ScalarConnectorDefinition,
  DocString,
  StructConnectorDefinition,
  Token,
  Modifications,
  ComponentDeclaration,
  Expression,
  Indices,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import { astLog, instLog } from "./log.js";
import {
  NormalizedDyadComponent,
  dyadComponent,
  normalizeComponent,
} from "../metadata/component.js";
import { zodIssue2Problem } from "../metadata/issues.js";
import {
  ResolvedType,
  ResolvedStructConnectorType,
  ResolvedScalarConnectorType,
  structConnectorType,
  scalarConnectorType,
  resolveType,
} from "../workspace/types/index.js";
import { NonScalarTypeError } from "../workspace/errors.js";
import {
  Nullable,
  Problem,
  Result,
  failedResult,
  partialResult,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { unexpectedValue } from "./errors.js";
import { mobxClone, problemSpan } from "../workspace/utils.js";
import { QueryHandler } from "../workspace/selector.js";

export interface StructConnectorInstance {
  kind: StructConnectorDefinition["kind"];
  name: Token;
  elems: ConnectorElementInstance[];
  metadata: NormalizedDyadComponent;
  def: StructConnectorDefinition;
  type: ResolvedStructConnectorType;
  dims: Array<Expression>;
  indices: Indices;
  cond: Nullable<Expression>;
  doc_string: Nullable<DocString>;
}

export interface ScalarConnectorInstance {
  kind: ScalarConnectorDefinition["kind"];
  name: Token;
  metadata: NormalizedDyadComponent;
  def: ScalarConnectorDefinition;
  type: ResolvedScalarConnectorType;
  dims: Array<Expression>;
  indices: Indices;
  cond: Nullable<Expression>;
  doc_string: Nullable<DocString>;
}

export type ConnectorInstance =
  | StructConnectorInstance
  | ScalarConnectorInstance;

export interface ConnectorElementInstance {
  kind: "cvari";
  name: string;
  attributes: Modifications;
  type: ResolvedType;
  qualifier: ConnectorVariableQualifiers;
  doc_string: Nullable<DocString>;
}

const issueMap = zodIssue2Problem("instantiateConnector", "component");

export function instantiateRecordConnector(
  def: StructConnectorDefinition,
  decl: Nullable<ComponentDeclaration>,
  referenceSpan: Nullable<TextualSpan>,
  query: QueryHandler
): Result<StructConnectorInstance> {
  astLog("AST for connector %s: %j", def.name, def);
  const problems: Problem[] = [];

  const instanceModifications = decl?.instance?.mods ?? {};
  const instanceMetadata = decl?.metadata;
  if (Object.keys(instanceModifications).length > 0) {
    problems.push(
      unexpectedValue(
        def.name.value,
        `Instantiation of connector ${def.name.value} included modifications...this is currently not supported`,
        problemSpan(def, referenceSpan)
      )
    );
  }

  // We use passthrough to preserve non-standard metadata
  const validated = dyadComponent
    .passthrough()
    .safeParse(instanceMetadata ? instanceMetadata.value : {});

  if (!validated.success) {
    problems.push(
      ...validated.error.issues.map((x) =>
        issueMap(x, problemSpan(def, instanceMetadata?.span ?? null))
      )
    );
  }

  const norm = normalizeComponent(validated.success ? validated.data : {});
  const doc_string = def.doc_string;

  const ret: StructConnectorInstance = {
    kind: "strcon",
    name: def.name,
    elems: [],
    def: def,
    type: structConnectorType(def),
    metadata: norm,
    dims: decl?.dims.map(mobxClone) || [],
    indices: decl?.indices.map(mobxClone) || [],
    cond: decl?.cond ? mobxClone(decl.cond) : null,
    doc_string: doc_string,
  };

  Object.entries(def.elements).map(([n, e]) =>
    instantiateElement(def, n, e, query).ifResult((r) => {
      ret.elems.push(r);
    }, problems)
  );

  instLog("Instance of %s: %j", def.name, ret);
  return partialResult(ret, ...problems);
}

export function instantiateScalarConnector(
  cdef: ScalarConnectorDefinition,
  decl: Nullable<ComponentDeclaration>,
  referenceSpan: Nullable<TextualSpan>
): Result<ScalarConnectorInstance> {
  astLog("AST for connector %s: %j", cdef.name, cdef);
  const problems: Problem[] = [];

  const instanceModifications = decl?.instance?.mods ?? {};
  const instanceMetadata = decl?.metadata;
  if (Object.keys(instanceModifications).length > 0) {
    problems.push(
      unexpectedValue(
        cdef.name.value,
        `Instantiation of connector ${cdef.name.value} included modifications...this is currently not supported`,
        problemSpan(cdef, referenceSpan)
      )
    );
  }

  // We use passthrough to preserve non-standard metadata
  const validated = dyadComponent
    .passthrough()
    .safeParse(instanceMetadata ? instanceMetadata.value : {});

  if (!validated.success) {
    problems.push(
      ...validated.error.issues.map((x) =>
        issueMap(x, problemSpan(cdef, instanceMetadata?.span ?? null))
      )
    );
  }

  const norm = normalizeComponent(validated.success ? validated.data : {});
  const doc_string = cdef.doc_string;

  const ret: ScalarConnectorInstance = {
    kind: "sclcon",
    name: cdef.name,
    def: cdef,
    type: scalarConnectorType(cdef),
    dims: decl?.dims.map(mobxClone) ?? [],
    indices: decl?.indices.map(mobxClone) || [],
    cond: decl?.cond ? mobxClone(decl.cond) : null,
    metadata: norm,
    doc_string: doc_string,
  };
  instLog("Instance of %s: %j", cdef.name, ret);
  return partialResult(ret, ...problems);
}

function instantiateElement(
  c: ConnectorDefinition,
  name: string,
  decl: ConnectionVariableDeclaration,
  query: QueryHandler
): Result<ConnectorElementInstance> {
  return query(resolveType(decl.type.name, c, [])).chain((resolved) => {
    switch (resolved.resolves) {
      case "struct": {
        const mods = mobxClone({ ...decl.type.mods });
        const ret: ConnectorElementInstance = {
          kind: "cvari",
          name: name,
          qualifier: decl.qualifier,
          attributes: mods,
          type: resolved,
          doc_string: decl.doc_string,
        };
        // TODO: process other declaration modifications
        return successfulResult(ret);
      }
      case "scalar": {
        const mods = {
          ...resolved.mods,
          ...mobxClone(decl.type.mods),
        };
        const ret: ConnectorElementInstance = {
          kind: "cvari",
          name: name,
          qualifier: decl.qualifier,
          attributes: mods,
          type: resolved,
          doc_string: decl.doc_string,
        };
        // TODO: process other declaration modifications
        return successfulResult(ret);
      }
      default:
        return failedResult(
          new NonScalarTypeError(
            name,
            `Connector variable ${name} has non-scalar type ${resolved.resolves}`,
            problemSpan(c, decl.span)
          )
        );
    }
  });
}
