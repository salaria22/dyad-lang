import { Nullable } from "@juliacomputing/dyad-common";
import {
  Children,
  childArray,
  childObject,
  possibleMetadata,
} from "./children.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { Declaration } from "./declaration";
import { MetadataNode } from "./metadata";
import { ASTNode } from "./node.js";
import { QualifiedType } from "./qualifier";
import { Relation } from "./relations";
import { Token } from "./token.js";
import { SourceKey } from "./keys.js";

export type AnalysisQualifier = "test" | "example" | "partial";

/**
 * This interface represents an `AnalysisDefinition` node.
 *
 * @category AST Nodes
 */
export interface AnalysisDefinition {
  kind: "adef";
  /** This is the name of the analysis being defined. */
  name: Token;
  /** Qualifier for analyses */
  qualifier: Nullable<AnalysisQualifier>;
  /**
   * The analysis this analysis is being extended from.  N.B. - while
   * components can be extended from zero or more analyses, a new analysis must
   * be extended from exactly one existing analysis.  In this way, they are more
   * like scalar types.  Also like scalar types, there are special "built-in"
   * analyses that all analyses must be derived from.
   */
  extends: QualifiedType;
  /** Any declarations contained in the model definition */
  declarations: Record<string, Declaration>;
  /** An array of relations related to this component (equations, transitions, connections) */
  relations: Array<Relation>;
  /** The (optional) doc string associated with the model definition */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with the model definition */
  metadata: Nullable<MetadataNode>;
  /** Source file */
  source: Nullable<SourceKey>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/**
 * A constructor function used to build an analysis definition
 *
 * @category AST Nodes
 *
 * @param name This is the name of the analysis being defined.
 * @param qualifier Qualifier for analyses
 * @param ext The analysis this analysis is being extended from.
 * @param declarations Any declarations contained in the model definition
 * @param relations An array of relations related to this component (equations, transitions, connections)
 * @param doc_string The (optional) doc string associated with the model definition
 * @param metadata Any (optional) metadata associated with the model definition
 * @param span The span of this entire entity within the file
 * @returns
 */
export function analysisDefinition(
  name: Token,
  qualifier: Nullable<AnalysisQualifier>,
  ext: QualifiedType,
  declarations: Record<string, Declaration>,
  relations: Array<Relation>,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): AnalysisDefinition {
  return {
    kind: "adef",
    name,
    qualifier,
    extends: ext,
    declarations,
    relations,
    doc_string,
    metadata,
    source,
    span,
  };
}

/**
 * List of children for `AnalysisDefinition` nodes
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function analysisChildren(def: AnalysisDefinition): Children {
  const ret = possibleMetadata(def);
  const decls = childObject("declarations", def);
  const rels = childArray("relations", def);

  return { ...ret, ...decls, ...rels, extends: def.extends };
}

/** A predicate used to determine if a given `ASTNode` is a `ModelDefinition`
 *
 * @category Type Predicates
 **/
export function isAnalysisDefinition(
  node: ASTNode | null
): node is AnalysisDefinition {
  return node !== null && node.kind === "adef";
}
