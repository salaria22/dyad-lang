import {
  Definition,
  DocString,
  Expression,
  MetadataNode,
  Modifications,
  StructTypeDefinition,
} from "@juliacomputing/dyad-ast";
import {
  FailedResult,
  Nullable,
  Problem,
  Result,
  failedResult,
  partialResult,
} from "@juliacomputing/dyad-common";
import { problemSpan, QueryHandler, resolveType } from "../workspace/index.js";
import {
  NormalizedDyadDefinition,
  normalizeDefinition,
} from "../metadata/definition.js";
import { zodIssue2Problem } from "../metadata/issues.js";
import { dyadDeclaration } from "../metadata/declaration.js";
import { ScalarTypeInstance, instantiateScalarType } from "./scalar.js";
import { UnimplementedError } from "../workspace/errors.js";
import { FunctionTypeInstance, instantiateFunctionType } from "./function.js";

export interface StructTypeInstance {
  kind: StructTypeDefinition["kind"];
  /** The StructTypeDefinition this is an instance of */
  def: StructTypeDefinition;
  /** Modifications for this type (might be different from those of the definition) */
  mods: Modifications;
  /** The elements of this struct instance */
  elems: StructElementInstance[];
  /** The normalized metadata */
  metadata: NormalizedDyadDefinition;
}

export interface StructElementInstance {
  /** Name of the field (token for better error messages?) */
  name: string;
  /** Whether this is a scalar instance or a struct instance */
  type: ScalarTypeInstance | StructTypeInstance | FunctionTypeInstance;
  /** The initial value for this field */
  init: Nullable<Expression>;
  /** The doc string for this field */
  doc_string: Nullable<DocString>;
}

const issueMap = zodIssue2Problem("instantiateRecordType", "definition");

export function instantiateRecordType(
  rdef: StructTypeDefinition,
  /** These are the modifications applied to the instance, *NOT* the definition */
  mods: Modifications,
  /** This is the metadata of the instance, *NOT* the definition */
  instanceMetadata: Nullable<MetadataNode>,
  context: Definition,
  query: QueryHandler
): Result<StructTypeInstance> {
  const problems: Problem<unknown>[] = [];

  // We use passthrough to preserve non-standard metadata
  const validated = dyadDeclaration
    .passthrough()
    .safeParse(instanceMetadata ? instanceMetadata.value : {});

  if (!validated.success) {
    problems.push(
      ...validated.error.issues.map((x) =>
        issueMap(x, problemSpan(context, instanceMetadata?.span ?? null))
      )
    );
  }

  const norm = normalizeDefinition(validated.success ? validated.data : {});

  const ret: StructTypeInstance = {
    kind: "struct",
    def: rdef,
    mods,
    elems: [],
    metadata: norm,
  };

  for (const [name, field] of Object.entries(rdef.fields)) {
    const doc_string = field.doc_string;
    const init = field.init;
    const ftype = query(resolveType(field.type.name, context, []));

    if (ftype instanceof FailedResult) {
      return ftype;
    }
    ftype.ifResult((t) => {
      switch (t.resolves) {
        case "struct": {
          const rt = instantiateRecordType(
            t.def,
            { ...field.type.mods },
            null,
            t.def,
            query
          );
          rt.ifResult((t) => {
            ret.elems.push({
              name,
              init,
              type: t,
              doc_string,
            });
          }, problems);
          break;
        }
        case "scalar": {
          const st = instantiateScalarType(
            t,
            { ...field.type.mods },
            null,
            null,
            field.doc_string
          );
          st.ifResult((t) => {
            ret.elems.push({
              name,
              init,
              doc_string,
              type: t,
            });
          }, problems);
          break;
        }
        case "fun": {
          const ft = instantiateFunctionType(t);
          ret.elems.push({
            name,
            init,
            doc_string,
            type: ft,
          });
          break;
        }
        default: {
          problems.push(
            new UnimplementedError(
              "instantiateRecordType",
              `The '${t.resolves} type is not supported as a struct field`
            )
          );
        }
      }
    }, problems);
  }
  if (problems.length > 0) {
    return failedResult(problems[0], ...problems.slice(1));
  }
  return partialResult(ret);
}
