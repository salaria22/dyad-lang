import type { CstElement, CstNode, IToken } from "chevrotain";

export function isToken(elem: CstElement): elem is IToken {
  return (elem as any)["tokenTypeIdx"] !== undefined;
}

export function isNode(elem: CstElement): elem is CstNode {
  return (elem as any)["tokenTypeIdx"] === undefined;
}
