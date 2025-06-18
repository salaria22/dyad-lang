import { CstNode, IToken } from "chevrotain";
import { Doc_stringCstNode, DyadNodeVisitor } from "../parser/index.js";
import {
  BinaryOperator,
  Expression,
  IntegerLiteral,
  RealLiteral,
  binaryExpr,
  integerLiteral,
  prefixFactors,
  realLiteral,
  Token,
  createToken,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import {
  ChildTokenKeys,
  GenericCstChildren,
  TokenChildren,
  mapSingleton,
} from "./map.js";
import { isToken } from "../parser/predicates.js";
import { Nullable, FirstArgument } from "@juliacomputing/dyad-common";

export type Handler = (children: CstNode | CstNode[]) => void;

export type EvalHandler<N, R> = (x: N, children: Record<string, R>) => R;

export type Remap<T, R> = {
  [P in keyof T]: R;
};

export type NodeMap<T> = {
  [P in keyof T]: { name: P; children: FirstArgument<T[P]> };
};

export type NodeRemap<T, R> = {
  [P in keyof T]: { name: P; children: Remap<FirstArgument<T[P]>, R> };
};

export type Handlers<T, R = void> = {
  [P in keyof T]?: (node: { name: P; children: FirstArgument<T[P]> }) => R;
};

export type NodeTypes<T> = FirstArgument<Handlers<T>[keyof Handlers<T>]>;

// export type DyadMap = NodeRemap<DyadNodeVisitor<any, any>, Metadata>;
export type DyadHandlers = Handlers<DyadNodeVisitor<any, any>>;
export type DyadNodes = NodeTypes<DyadNodeVisitor<any, any>>;

export function zip<T, U>(a: Array<T>, b: Array<U>): Array<[T, U]> {
  if (a.length !== b.length) {
    throw new Error(
      `Expected arrays of equal size, but found one with ${a.length} and the other with ${b.length}`
    );
  }
  return a.map((x, i) => [x, b[i]]);
}

export function assertTerms(terms: Array<any>, ops: Array<any>) {
  if (terms.length !== ops.length + 1) {
    throw new Error(
      `Found ${ops.length} operators and ${terms.length} terms, expected the number of terms to be one more than the number of operators`
    );
  }
}

export function parseBinaryOp(s: string): [BinaryOperator, boolean] {
  if (s.length === 0) {
    throw new Error(`Expected binary operator, got empty string`);
  }
  const elementwise = s[0] === ".";
  const op = elementwise ? s.slice(1) : s;
  switch (op) {
    case "+":
    case "-":
    case "*":
    case "%":
    case "/":
    case ">=":
    case ">":
    case "and":
    case "or":
    case "==":
    case "<=":
    case "<":
    case "!=":
    case "^":
      return [op, elementwise];
    default:
      throw new Error(`Expected binary operator, got ${op}`);
  }
}

export function parseLiteral(token: Token): IntegerLiteral | RealLiteral {
  let numericLiteral = token.value;
  let factor = 1;
  let prefix: Nullable<string> = null;
  const last = numericLiteral.length - 1;
  const pen = numericLiteral.length - 2;

  if (prefixFactors.has(numericLiteral.slice(pen))) {
    prefix = numericLiteral.slice(pen);
    numericLiteral = numericLiteral.slice(0, pen);
  } else if (prefixFactors.has(numericLiteral[last])) {
    prefix = numericLiteral[last];
    numericLiteral = numericLiteral.slice(0, last);
  }

  if (prefix !== null) {
    factor = prefixFactors.get(prefix) ?? 1;
  }

  const num = Number.parseFloat(numericLiteral) * factor;
  return Number.isInteger(num)
    ? integerLiteral(num, prefix, token.span, token.value)
    : realLiteral(num, prefix, token.span, token.value);
}

export function reduceBinaryTerms(
  terms: Expression[],
  ops: IToken[],
  right?: boolean
): Expression {
  if (right) {
    return terms.slice(1).reduceRight((p, t, i) => {
      const details = parseBinaryOp(ops[i].image);
      return binaryExpr(p, details[0], details[1], t);
    }, terms[0]);
  }
  return terms.slice(1).reduce((p, t, i) => {
    const details = parseBinaryOp(ops[i].image);
    return binaryExpr(p, details[0], details[1], t);
  }, terms[0]);
}

export function identity<T>(x: T): T {
  return x;
}

export function asToken(t: IToken): Token {
  return createToken(t.image, {
    sl: t.startLine ?? 0,
    sc: t.startColumn ?? 0,
    el: t.endLine ?? 0,
    ec: t.endColumn ?? 0,
  });
}
export function asImage(t: IToken): string {
  return t.image;
}

export function as<T, R>(f: (x: T) => R) {
  return (n: { children: T }) => f(n.children);
}

/**
 * This function determines the textual span of an entire collection
 * of tokens.
 * @param tokens
 * @returns
 */
export function getSpan(possible: Array<Nullable<Token>>): TextualSpan {
  const tokens = possible.filter((x): x is Token => x !== null);
  if (tokens.length < 1) {
    throw new Error(`Call to getSpan with no tokens`);
  }
  const span0 = tokens[0].span;
  if (span0 === null) {
    throw new Error(
      `Found Token, '${tokens[0].value}', with missing span during parsing`
    );
  }
  const cur = span0;
  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    const tspan = tokens[i].span;
    if (tspan === null) {
      throw new Error(
        `Fount Token, '${tokens[i].value}', with missing span during parsing`
      );
    }
    if (tspan.sl < cur.sl || (tspan.sl === cur.sl && tspan.sc < cur.sc)) {
      cur.sl = tspan.sl;
      cur.sc = tspan.sc;
    }
    if (tspan.el > cur.el || (tspan.el === cur.el && tspan.ec > cur.ec)) {
      cur.el = tspan.el;
      cur.ec = tspan.ec;
    }
  }
  return cur;
}

export function getRegion<T>(
  children: TokenChildren<T>,
  startToken: ChildTokenKeys<T>,
  endToken: ChildTokenKeys<T>
) {
  const start = mapSingleton(children, startToken, (x) => x.startOffset);
  const end = mapSingleton(
    children,
    endToken,
    (x) => x.startOffset + x.image.length
  );
  return { start, end };
}

export function docStringStart(
  ds: Doc_stringCstNode[] | undefined
): number | null {
  if (ds) {
    const norm = ds[0].children.DocLine;
    return norm[0].startOffset;
  }
  return null;
}

export function getAllTokens<T>(children: GenericCstChildren): Token[] {
  const ret: Token[] = [];
  for (const v in children) {
    const elems = children[v];
    for (const elem of elems) {
      if (isToken(elem)) {
        ret.push(asToken(elem));
      } else {
        const sub = getAllTokens(elem.children);
        ret.push(...sub);
      }
    }
  }
  return ret;
}

export function getTreeRegion<T>(children: GenericCstChildren): {
  start: number;
  end: number;
} {
  let start: number | null = null;
  let end: number | null = null;
  for (const v in children) {
    const elems = children[v];
    for (const elem of elems) {
      if (isToken(elem)) {
        if (start === null || start > elem.startOffset) {
          start = elem.startOffset;
        }
        const last = elem.startOffset + elem.image.length;
        if (end === null || end < last) {
          end = last;
        }
      } else {
        const sub = getTreeRegion(elem.children);
        if (start === null || start > sub.start) {
          start = sub.start;
        }
        if (end === null || end < sub.end) {
          end = sub.end;
        }
      }
    }
  }
  if (start === null || end === null) {
    throw new Error(
      `Unable to find any tokens in tree: ${JSON.stringify(children)}`
    );
  }
  return { start, end };
}
