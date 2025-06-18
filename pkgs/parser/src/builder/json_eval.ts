import type { CstNode } from "chevrotain";
import { JSONValue } from "@juliacomputing/dyad-ast";
import {
  ArrayCstChildren,
  JsonCstChildren,
  JsonNodeVisitor,
  ObjectCstChildren,
  ObjectItemCstChildren,
  ValueCstChildren,
} from "../parser/index.js";

export class JsonEval implements JsonNodeVisitor<void, JSONValue> {
  json(children: JsonCstChildren, param?: void | undefined): JSONValue {
    if (children.object) {
      const obj = children.object;
      if (obj.length !== 1) {
        throw new Error(`Expected one object, got ${obj.length}`);
      }
      return this.object(obj[0].children);
    } else if (children.array) {
      const arr = children.array;
      if (arr.length !== 1) {
        throw new Error(`Expected one object, got ${arr.length}`);
      }
      return this.array(arr[0].children);
    }
    throw new Error("Method not implemented.");
  }
  object(
    children: ObjectCstChildren,
    param?: void | undefined
  ): Record<string, JSONValue> {
    let ret: Record<string, JSONValue> = {};
    for (const child of children.objectItem ?? []) {
      const cv = this.objectItem(child.children);
      ret = { ...ret, ...cv };
    }
    return ret;
  }
  objectItem(
    children: ObjectItemCstChildren,
    param?: void | undefined
  ): Record<string, JSONValue> {
    const ret: Record<string, JSONValue> = {};
    for (let i = 0; i < children.StringLiteral.length; i++) {
      const str = children.StringLiteral[i].image;
      const key = str.slice(1, str.length - 1);
      const v = children.value[i];
      const value = this.value(v.children);
      ret[key] = value;
    }
    return ret;
  }
  array(children: ArrayCstChildren, param?: void | undefined): JSONValue {
    if (children.value) {
      return children.value.map((v) => this.value(v.children));
    }
    return [];
  }
  value(children: ValueCstChildren, param?: void | undefined): JSONValue {
    if (children.StringLiteral) {
      const str = children.StringLiteral[0].image;
      const key = str.slice(1, str.length - 1);
      return key;
    }
    if (children.NumberLiteral) {
      let factor = 1;
      if (children.prefix) {
        if (children.prefix[0].image === "-") {
          factor = -1;
        }
      }
      return factor * +children.NumberLiteral[0].image;
    }
    if (children.object) {
      return this.object(children.object[0].children);
    }
    if (children.array) {
      return this.array(children.array[0].children);
    }
    if (children.BooleanLiteral) {
      return children.BooleanLiteral[0].image === "true";
    }
    if (children.Null) {
      return null;
    }
    throw new Error(
      `Unabled to process json value: ${JSON.stringify(children)}`
    );
  }
  visit(cstNode: CstNode | CstNode[], param?: void | undefined): JSONValue {
    if (Array.isArray(cstNode)) {
      throw new Error("Arrays of CST nodes unsupported in JsonEval.visit");
    }
    const name = cstNode.name;
    const children = cstNode.children;
    return (this as any)[name](children);
  }
  validateVisitor(): void {
    throw new Error("Method not implemented.");
  }
}
