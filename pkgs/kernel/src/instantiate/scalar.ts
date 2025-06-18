import {
  DocString,
  Expression,
  MetadataNode,
  Modifications,
  ScalarTypeDefinition,
} from "@juliacomputing/dyad-ast";
import { ResolvedScalarType } from "../workspace/types/index.js";
import {
  Nullable,
  Problem,
  Result,
  partialResult,
} from "@juliacomputing/dyad-common";
import { zodIssue2Problem } from "../metadata/issues.js";
import {
  NormalizedDyadDeclaration,
  dyadDeclaration,
  normalizeDefinition,
} from "../metadata/index.js";

/**
 * A scalar type instance isn't much more than the ScalarType
 * itself.  However, an instance can have one additional set
 * of modifications applied to it that are not capture in the
 * type.
 */
export interface ScalarTypeInstance {
  kind: ScalarTypeDefinition["kind"];
  /** The ResolvedScalarType */
  type: ResolvedScalarType;
  mods: Modifications;
  init: Nullable<Expression>;
  doc_string: Nullable<DocString>;
  metadata: NormalizedDyadDeclaration;
}

const issueMap = zodIssue2Problem("instantiateRecordType", "definition");

export function instantiateScalarType(
  st: ResolvedScalarType,
  /** These are the modifications applied to the instance, *NOT* the definition */
  instanceModifications: Modifications,
  /** This is the metadata of the instance, *NOT* the definition */
  instanceMetadata: Nullable<MetadataNode>,
  init: Nullable<Expression>,
  doc_string: Nullable<DocString>
): Result<ScalarTypeInstance> {
  const problems: Problem<unknown>[] = [];

  // We use passthrough to preserve non-standard metadata
  const validated = dyadDeclaration
    .passthrough()
    .safeParse(instanceMetadata ? instanceMetadata.value : {});

  if (!validated.success) {
    problems.push(
      ...validated.error.issues.map((x) =>
        issueMap(x, { file: st.source, span: instanceMetadata?.span ?? null })
      )
    );
  }

  const norm = normalizeDefinition(validated.success ? validated.data : {});

  const mods = { ...st.mods, ...instanceModifications };

  const ret: ScalarTypeInstance = {
    kind: "scalar",
    type: st,
    mods,
    metadata: norm,
    init,
    doc_string,
  };

  return partialResult(ret, ...problems);
}
