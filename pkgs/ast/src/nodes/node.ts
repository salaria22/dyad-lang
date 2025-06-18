import { ConnectionVariableDeclaration } from "./convar.js";
import { Definition } from "./definitions.js";
import { DyadLibrary, DyadModule } from "./library.js";
import { WorkspaceNode } from "./workspace.js";
import { FileContents } from "./file.js";
import { QualifiedType } from "./qualifier.js";
import { MetadataNode } from "./metadata.js";
import { UsingStatement } from "./using.js";
import { StructFieldDeclaration } from "./field.js";
import { Relation } from "./relations.js";
import { Declaration } from "./declaration.js";
import { CaseClause } from "./switch.js";
import { ElseIfClause } from "./if.js";

/** The complete list of all types of abstract syntax tree nodes
 *
 * @category AST Nodes
 */
export type ASTNode =
  | WorkspaceNode
  | DyadLibrary
  | DyadModule
  | FileContents
  | Definition
  | ConnectionVariableDeclaration
  | StructFieldDeclaration
  | Declaration
  | Relation
  | CaseClause
  | ElseIfClause
  | MetadataNode
  | UsingStatement
  | QualifiedType;
