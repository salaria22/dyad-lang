import { assertUnreachable } from "@juliacomputing/dyad-common";
import { ComponentDeclaration } from "./component_declaration.js";
import { Connection } from "./connection.js";
import {
  ScalarConnectorDefinition,
  StructConnectorDefinition,
} from "./connector.js";
import { ConnectionVariableDeclaration } from "./convar.js";
import { EnumTypeDefinition } from "./enum.js";
import { Equation } from "./equation.js";
import { StructFieldDeclaration } from "./field.js";
import { ParsedFile, RawFile } from "./file.js";
import { DyadLibrary, DyadModule } from "./library.js";
import { MetadataNode } from "./metadata.js";
import { ComponentDefinition } from "./component_definition.js";
import { ASTNode } from "./node.js";
import { QualifiedType } from "./qualifier.js";
import { StructTypeDefinition } from "./struct.js";
import { ScalarTypeDefinition } from "./scalar.js";
import { UsingStatement } from "./using.js";
import { VariableDeclaration } from "./variable.js";
import { WorkspaceNode } from "./workspace.js";
import { Transition } from "./transition.js";
import { AnalysisDefinition } from "./analysis.js";
import { FunctionTypeDefinition } from "./function.js";
import { ContinuitySet } from "./continuity.js";
import { ElseIfClause, IfStatement } from "./if.js";
import { CaseClause, SwitchStatement } from "./switch.js";
import { AnalysisPoint } from "./analysis_point.js";
import { Assertion } from "./assert.js";
import { ForLoopStatement } from "./forloop.js";

/**
 * This interface represents an operation that can be applied to all possible
 * AST Node types.
 *
 * @category AST Nodes
 */
export interface NodeOperator<T, C = {}> {
  adef: (model: AnalysisDefinition, context?: C) => T;
  ap: (ap: AnalysisPoint, context?: C) => T;
  assert: (assertion: Assertion, context?: C) => T;
  casec: (casec: CaseClause, context?: C) => T;
  cdecl: (decl: ComponentDeclaration, context?: C) => T;
  cdef: (model: ComponentDefinition, context?: C) => T;
  cont: (cont: ContinuitySet, context?: C) => T;
  cvar: (decl: ConnectionVariableDeclaration, context?: C) => T;
  cxn: (connection: Connection, context?: C) => T;
  eq: (equation: Equation, context?: C) => T;
  elif: (elif: ElseIfClause, context?: C) => T;
  enum: (def: EnumTypeDefinition, context?: C) => T;
  field: (def: StructFieldDeclaration, context?: C) => T;
  file: (file: ParsedFile, context?: C) => T;
  forl: (forl: ForLoopStatement, context?: C) => T;
  fun: (f: FunctionTypeDefinition, context?: C) => T;
  ifs: (ifs: IfStatement, context?: C) => T;
  lib: (lib: DyadLibrary, context?: C) => T;
  module: (mod: DyadModule, context?: C) => T;
  meta: (meta: MetadataNode, context?: C) => T;
  raw: (file: RawFile, context?: C) => T;
  scalar: (def: ScalarTypeDefinition, context?: C) => T;
  sclcon: (def: ScalarConnectorDefinition, context?: C) => T;
  st: (transition: Transition, context?: C) => T;
  strcon: (def: StructConnectorDefinition, context?: C) => T;
  struct: (def: StructTypeDefinition, context?: C) => T;
  sw: (sw: SwitchStatement, context?: C) => T;
  qtype: (qual: QualifiedType, context?: C) => T;
  var: (v: VariableDeclaration, context?: C) => T;
  using: (v: UsingStatement, context?: C) => T;
  workspace: (workspace: WorkspaceNode, context?: C) => T;
}

/**
 * This function effective performs the operation associated with a given
 * `NodeOperator` to a particular node.
 *
 * @category AST Nodes
 * @param node
 * @param op
 * @returns
 */
export function nodeCase<T, C = void>(
  node: ASTNode,
  op: NodeOperator<T, C>,
  context?: C
): T {
  switch (node.kind) {
    case "adef":
      return op.adef(node, context);
    case "ap":
      return op.ap(node, context);
    case "assert":
      return op.assert(node, context);
    case "casec":
      return op.casec(node, context);
    case "cdecl":
      return op.cdecl(node, context);
    case "cdef":
      return op.cdef(node, context);
    case "cont":
      return op.cont(node, context);
    case "cvar":
      return op.cvar(node, context);
    case "cxn":
      return op.cxn(node, context);
    case "elif":
      return op.elif(node, context);
    case "eq":
      return op.eq(node, context);
    case "enum":
      return op.enum(node, context);
    case "field":
      return op.field(node, context);
    case "file":
      return op.file(node, context);
    case "forl":
      return op.forl(node, context);
    case "fun":
      return op.fun(node, context);
    case "ifs":
      return op.ifs(node, context);
    case "lib":
      return op.lib(node, context);
    case "module":
      return op.module(node, context);
    case "meta":
      return op.meta(node, context);
    case "raw":
      return op.raw(node, context);
    case "scalar":
      return op.scalar(node, context);
    case "sclcon":
      return op.sclcon(node, context);
    case "st":
      return op.st(node, context);
    case "strcon":
      return op.strcon(node, context);
    case "struct":
      return op.struct(node, context);
    case "sw":
      return op.sw(node, context);
    case "qtype":
      return op.qtype(node, context);
    case "var":
      return op.var(node, context);
    case "using":
      return op.using(node, context);
    case "workspace":
      return op.workspace(node, context);
    default:
      assertUnreachable(node);
  }
}
