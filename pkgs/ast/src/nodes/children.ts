import { nodeCase } from "./case";
import { componentDeclarationChildren } from "./component_declaration";
import { connectionChildren } from "./connection";
import {
  scalarConnectorDefinitionChildren,
  structConnectorDefinitionChildren,
} from "./connector";
import { connectionVariableDeclarationChildren } from "./convar";
import { enumTypeDefinitionChildren } from "./enum";
import { equationChildren } from "./equation";
import { structFieldDeclarationChildren } from "./field";
import { parsedFileChildren, rawFileChildren } from "./file";
import { DyadLibraryChildren, DyadModuleChildren } from "./library";
import { MetadataNode, metadataNodeChildren } from "./metadata";
import { componentChildren } from "./component_definition";
import { ASTNode } from "./node";
import { qualifiedTypeChildren } from "./qualifier";
import { structTypeDefinitionChildren } from "./struct";
import { scalarTypeDefinitionChildren } from "./scalar";
import { usingStatementChildren } from "./using";
import { variableDeclarationChildren } from "./variable";
import { workspaceNodeChildren } from "./workspace";
import { transitionChildren } from "./transition";
import { analysisChildren } from "./analysis";
import { functionTypeDefinitionChildren } from "./function";
import { Nullable } from "@juliacomputing/dyad-common";
import { continuitySetChildren } from "./continuity.js";
import { analysisPointChildren } from "./analysis_point.js";
import { elseIfClauseChildren, ifStatementChildren } from "./if.js";
import { caseClauseChildren, switchStatementChildren } from "./switch.js";
import { assertionChildren } from "./assert.js";
import { forLoopStatementChildren } from "./forloop.js";

/**
 * Children of a particular AST Node.  The key value for this record **must** be
 * the path to the child (i.e., as accepted by lodash's _.get(...) function):
 * https://lodash.com/docs/4.17.15#get
 *
 * @category Navigation
 */
export type Children = Record<string, ASTNode>;

/**
 * This function returns the children of a given node.  See the definition of
 * `Children` for an important note on the syntax for child paths.
 *
 * @category Navigation
 *
 * @param node Node to find the children of
 * @returns The set of children associated with the given node.
 */
export function nodeChildren(node: ASTNode): Children {
  return nodeCase(node, {
    adef: analysisChildren,
    ap: analysisPointChildren,
    assert: assertionChildren,
    casec: caseClauseChildren,
    cdecl: componentDeclarationChildren,
    cdef: componentChildren,
    cont: continuitySetChildren,
    cvar: connectionVariableDeclarationChildren,
    cxn: connectionChildren,
    elif: elseIfClauseChildren,
    eq: equationChildren,
    field: structFieldDeclarationChildren,
    enum: enumTypeDefinitionChildren,
    fun: functionTypeDefinitionChildren,
    file: parsedFileChildren,
    forl: forLoopStatementChildren,
    ifs: ifStatementChildren,
    lib: DyadLibraryChildren,
    module: DyadModuleChildren,
    meta: metadataNodeChildren,
    raw: rawFileChildren,
    scalar: scalarTypeDefinitionChildren,
    sclcon: scalarConnectorDefinitionChildren,
    struct: structTypeDefinitionChildren,
    strcon: structConnectorDefinitionChildren,
    st: transitionChildren,
    sw: switchStatementChildren,
    qtype: qualifiedTypeChildren,
    var: variableDeclarationChildren,
    using: usingStatementChildren,
    workspace: workspaceNodeChildren,
  });
}

/**
 * This is a helper type for extracting the keys in an object that reference
 * records of nodes.
 *
 * @category Navigation
 */
export type ChildObjectKeys<T> = {
  [k in keyof T]: T[k] extends Record<string, ASTNode> ? k : never;
}[keyof T];

/**
 * This type essentially filters out all non-child objects
 *
 * @category Navigation
 */
export type ChildObjects<T> = {
  [k in ChildObjectKeys<T>]: Record<string, ASTNode>;
};

/**
 * Extracts children associated with a nested record of ast nodes.  This method
 * may seem complicated, but it ensures that the key being used in the JSON path
 * is actually they key being referenced.
 *
 * @category Navigation
 *
 * @param child child that is a record of ast nodes.
 * @param node node that contains this child.
 * @returns children
 */
export function childObject<T>(
  child: ChildObjectKeys<T>,
  node: ChildObjects<T>
): Children {
  return Object.fromEntries(
    Object.entries(node[child]).map(([n, node]) => [
      `${String(child)}.${n}`,
      node,
    ])
  );
}

/**
 * This is a helper type for extracting the keys in an object that reference
 * arrays of nodes.
 *
 * @category Navigation
 */
export type ChildArrayKeys<T> = {
  [k in keyof T]: T[k] extends ASTNode[] ? k : never;
}[keyof T];

/**
 * This type essentially filters out all children that are not arrays of nodes
 *
 * @category Navigation
 */
export type ChildArrays<T> = {
  [k in ChildArrayKeys<T>]: ASTNode[];
};

/**
 * Extracts children associated with a nested arrays of ast nodes.  This method
 * may seem complicated, but it ensures that the index being used in the JSON path
 * is actually they index being referenced.
 *
 * @category Navigation
 *
 * @param child child that is an array of ast nodes.
 * @param node node that contains this child.
 * @returns children
 */
export function childArray<T>(
  child: ChildArrayKeys<T>,
  node: ChildArrays<T>
): Children {
  const arr = node[child];
  const ret: Children = {};
  const childString = String(child);
  for (let i = 0; i < arr.length; i++) {
    ret[childString + "." + i] = arr[i];
  }
  return ret;
}

/**
 * This function provides the `MetadataNode` child for any node that
 * might potentially contain metadata.
 *
 * @category Navigation
 *
 * @param obj
 * @returns
 */
export function possibleMetadata(obj: {
  metadata: Nullable<MetadataNode>;
}): Children {
  const ret: Children = {};
  if (obj.metadata) {
    ret["metadata"] = obj.metadata;
  }
  return ret;
}
