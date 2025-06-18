import { MetadataNode } from "./metadata.js";
import { QualifiedType } from "./qualifier.js";
import { Declaration } from "./declaration.js";
import { TextualSpan } from "./span.js";
import { DocString } from "./docs.js";
import { ASTNode } from "./node.js";
import {
  Children,
  childArray,
  childObject,
  possibleMetadata,
} from "./children.js";
import { Relation } from "./relations.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";
import { SourceKey } from "./keys.js";

/**
 * The various qualifiers that can be applied to a component
 *
 * @category AST Nodes
 */
export type ComponentQualifier = "partial" | "external" | "test" | "example";

/** The ASTNode that represents a model definition
 *
 * @category AST Nodes
 **/
export interface ComponentDefinition {
  kind: "cdef";
  /** `partial` indicates that this is meant to be extended, `internal` indicates that no Julia code will be generated */
  qualifier: Nullable<ComponentQualifier>;
  /** The name of the model */
  name: Token;
  /** Any extends clauses found in this model */
  extends: Array<QualifiedType>;
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
 * A construction function used to build a component definition
 *
 * @category AST Nodes
 *
 * @param qualifier `partial` indicates that this is meant to be extended, `internal` indicates that no Julia code will be generated
 * @param name The name of the model
 * @param ext Any extends clauses found in this model
 * @param declarations Any declarations contained in the model definition
 * @param relations An array of relations related to this component (equations, transitions, connections)
 * @param doc_string The (optional) doc string associated with the model definition
 * @param metadata Any (optional) metadata associated with the model definition
 * @param span The span of this entire entity within the file
 * @returns
 */
export function componentDefinition(
  qualifier: Nullable<ComponentQualifier>,
  name: Token,
  ext: Array<QualifiedType>,
  declarations: Record<string, Declaration>,
  relations: Array<Relation>,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  source: Nullable<SourceKey>,
  span: Nullable<TextualSpan>
): ComponentDefinition {
  return {
    kind: "cdef",
    qualifier,
    name,
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
 * List the children of a `ComponentDefinition` node
 *
 * @category Navigation
 * @param def
 * @returns
 */
export function componentChildren(def: ComponentDefinition): Children {
  const ret = possibleMetadata(def);
  const exts = childArray("extends", def);
  const decls = childObject("declarations", def);
  const rels = childArray("relations", def);

  return { ...ret, ...exts, ...decls, ...rels };
}

/** A predicate used to determine if a given `ASTNode` is a `ModelDefinition`
 *
 * @category Type Predicates
 **/
export function isComponentDefinition(
  node: ASTNode | null
): node is ComponentDefinition {
  return node !== null && node.kind === "cdef";
}
