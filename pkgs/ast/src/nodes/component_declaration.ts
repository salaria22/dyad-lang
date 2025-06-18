import { DocString } from "./docs.js";
import { Expression } from "../expr/index.js";
import { MetadataNode } from "./metadata.js";
import { QualifiedType } from "./qualifier.js";
import { TextualSpan } from "./span.js";
import { ASTNode } from "./node.js";
import { Children, possibleMetadata } from "./children.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { Token } from "./token.js";

export type Indices = Array<{ variable: string; range: Expression }>;
/**
 * Information associated with a component declaration.
 *
 * @category AST Nodes
 */
export interface ComponentDeclaration {
  kind: "cdecl";
  /**
   * The name of the component.  Note that the parent **also** keeps a record of this
   * so any renaming here has to change the name both here and in the parent record!
   **/
  name: Token;
  /** The type of the component being declared and any modifications being applied. */
  instance: QualifiedType;
  /** The type that constrains any future values for this declaration.  If it is null, then it is the same type as `instance`. */
  constraint: Nullable<QualifiedType>;
  // TODO: Construct via array comprehensions only?  Make modifications very easy!
  /** Expressions that indicate the length in each dimension. */
  dims: Array<Expression>;
  /** Indices used to construct the values */
  indices: Indices;
  /** Expression used when component is conditional */
  cond: Nullable<Expression>;
  /** The (optional) doc string associated with this component declaration */
  doc_string: Nullable<DocString>;
  /** Any (optional) metadata associated with this component declaration */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}

/** This function constructs a ComponentDeclaration
 *
 * @category AST Nodes
 **/
export function componentDeclaration(
  name: Token,
  instance: QualifiedType,
  constraint: Nullable<QualifiedType>,
  dims: Array<Expression>,
  indices: Indices,
  cond: Nullable<Expression>,
  doc_string: Nullable<DocString>,
  metadata: Nullable<MetadataNode>,
  span: Nullable<TextualSpan>
): ComponentDeclaration {
  return {
    kind: "cdecl",
    name,
    instance,
    constraint,
    dims,
    indices,
    cond,
    doc_string,
    metadata,
    span,
  };
}

/** List children of a `ComponentDeclaration` node
 *
 * @category Navigation
 */
export function componentDeclarationChildren(
  comp: ComponentDeclaration
): Children {
  const ret = possibleMetadata(comp);
  return { ...ret, instance: comp.instance };
}

/** A predicate that indicates whether a given `ASTNode` is a `ComponentDeclaration`
 *
 * @category Type Predicates
 **/
export function isComponentDeclaration(
  node: ASTNode | null
): node is ComponentDeclaration {
  return node !== null && node.kind === "cdecl";
}
