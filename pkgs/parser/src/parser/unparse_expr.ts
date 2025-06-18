import {
  BinaryExpression,
  BooleanLiteral,
  CompRef,
  Expression,
  FunctionCall,
  IntegerLiteral,
  ParentheticalExpression,
  RealLiteral,
  StringLiteral,
  TernaryExpression,
  UnaryExpression,
  UndefinedLiteral,
  exprCase,
  prefixFactors,
  ArrayExpression,
  RangeExpression,
} from "@juliacomputing/dyad-ast";

export function unparseExpression(node: Expression): string {
  return exprCase(node, {
    arr: function (node: ArrayExpression): string {
      return `[${node.contents.map(unparseExpression).join(", ")}]`;
    },
    bexp: function (node: BinaryExpression): string {
      const op = node.elementwise
        ? `.${node.op}`
        : node.op === "and" || node.op === "or"
          ? ` ${node.op} `
          : node.op;
      return `${unparseExpression(node.lhs)}${op}${unparseExpression(
        node.rhs
      )}`;
    },
    blit: function (node: BooleanLiteral): string {
      return node.value ? "true" : "false";
    },
    call: function (node: FunctionCall): string {
      const pos = node.positional.map(unparseExpression);
      const kw = Object.entries(node.keyword).map(
        ([k, v]) => `${k}=${unparseExpression(v)}`
      );
      return `${unparseExpression(node.func)}(${[...pos, ...kw].join(", ")})`;
    },
    cref: function (node: CompRef): string {
      return node.elems
        .map((e) => {
          if (e.indices.length === 0) {
            return e.name;
          }
          return `${e.name}[${e.indices.map(unparseExpression).join(",")}]`;
        })
        .join(".");
    },
    ilit: function (node: IntegerLiteral): string {
      return node.repr;
    },
    paren: function (node: ParentheticalExpression): string {
      return `(${unparseExpression(node.expr)})`;
    },
    range: function (node: RangeExpression): string {
      if (node.step) {
        return `${unparseExpression(node.start)}:${unparseExpression(
          node.step
        )}:${unparseExpression(node.end)}`;
      }
      return `${unparseExpression(node.start)}:${unparseExpression(node.end)}`;
    },
    rlit: function (node: RealLiteral): string {
      return node.repr;
    },
    slit: function (node: StringLiteral): string {
      return `"${node.value}"`;
    },
    texp: function (node: TernaryExpression): string {
      return `if ${unparseExpression(node.cond)} then ${unparseExpression(
        node.yes
      )} else ${unparseExpression(node.no)}`;
    },
    uexp: function (node: UnaryExpression): string {
      const op = node.elementwise ? `.${node.op}` : node.op;
      return `${op}${unparseExpression(node.rhs)}`;
    },
    ulit: function (node: UndefinedLiteral): string {
      return "undefined";
    },
  });
}
