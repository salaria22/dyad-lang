import { Nullable } from "@juliacomputing/dyad-common";
import { TextualSpan } from "./span";
import { DocString } from "./docs";
import { Expression } from "../expr";
import { MetadataNode } from "./metadata";
import { QualifiedType } from "./qualifier";
import { Token } from "./token";

/** This is data that all declarations will generally have
 *
 * @category AST Nodes
 */
export interface DeclarationBase {
  /** The (optional) doc string associated with this variable */
  doc_string: Nullable<DocString>;
  /**
   * The name of the component.  Note that the parent **also** keeps a record of this
   * so any renaming here has to change the name both here and in the parent record!
   **/
  name: Token;
  /** The type name for this variable */
  type: QualifiedType;
  // TODO: Construct via array comprehensions only?  Make modifications very easy!
  /** Expressions that indicate the length in each dimension. */
  dims: Array<Expression>;
  /** Expression used when declaration is conditional */
  cond: Nullable<Expression>;
  /** Any (optional) metadata associated with this variable */
  metadata: Nullable<MetadataNode>;
  /** The span of this entire entity within the file */
  span: Nullable<TextualSpan>;
}
