import {
  Component_metadataCstChildren,
  MetadataCstChildren,
} from "../parser/index.js";
import { JSONObject, JSONValue, MetadataNode } from "@juliacomputing/dyad-ast";
import { JsonEval } from "./json_eval.js";
import { CstNode } from "chevrotain";
import { mapSingleton } from "./map.js";

export function evalMetadata(
  children: MetadataCstChildren | Component_metadataCstChildren
): JSONObject {
  if (children.object.length !== 1) {
    throw new Error(`Expected one json child, found ${children.object.length}`);
  }

  const vis = new JsonEval();
  const value = mapSingleton(children, "object", (obj) =>
    vis.object(obj.children, undefined)
  );
  return value;
}

export function evalJson(node: CstNode): JSONValue {
  const vis = new JsonEval();
  return vis.visit(node);
}
