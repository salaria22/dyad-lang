import {
  arrayExpr,
  ArrayExpression,
  binaryExpr,
  BinaryExpression,
  exprCase,
  Expression,
  ExpressionOperator,
  FunctionCall,
  functionCall,
  parenExpr,
  ParentheticalExpression,
  rangeExpression,
  RangeExpression,
  TernaryExpression,
  ternaryExpression,
  unaryExpr,
  UnaryExpression,
} from "./index.js";

/**
 * Transform a given expression using the transformation function `f`.
 *
 * This function performs a depth-first traversal of the expression tree. At
 * each node, it calls the transform function, `f`, on that node. If the
 * function returns the same node, then no transformation occurs. If a different
 * node is returned, the original node is replaced by the node returned by `f`.
 *
 * @param expr Expression to transform
 * @param f Takes an input expression and returns an output expression (which
 * may be the same as the input expression)
 * @returns The (potentially) new expression
 */
export function transformExpression(
  expr: Expression,
  f: (n: Expression) => Expression
): Expression {
  const ret: ExpressionOperator<Expression> = {
    arr: (node: ArrayExpression): Expression =>
      f(
        arrayExpr(
          node.contents.map((x) => exprCase(x, ret)),
          null
        )
      ),
    bexp: (node: BinaryExpression): Expression => {
      const lhs = exprCase(node.lhs, ret);
      const rhs = exprCase(node.rhs, ret);
      return f(
        lhs === node.lhs && rhs === node.rhs
          ? node
          : binaryExpr(lhs, node.op, node.elementwise, rhs)
      );
    },
    blit: f,
    call: function (node: FunctionCall): Expression {
      const fname = exprCase(node.func, ret);
      if (fname.type !== "cref") {
        throw new Error(
          `Function name in transformed into a '${fname.type}, must be a component reference`
        );
      }
      return f(
        functionCall(
          fname,
          node.positional.map((x) => exprCase(x, ret)),
          Object.fromEntries(
            Object.entries(node.keyword).map(([key, val]) => [
              key,
              exprCase(val, ret),
            ])
          ),
          null
        )
      );
    },
    cref: f,
    ilit: f,
    paren: (node: ParentheticalExpression): Expression => {
      const expr = exprCase(node.expr, ret);
      return f(expr === node.expr ? node : parenExpr(expr, null));
    },
    range: (node: RangeExpression): Expression => {
      const start = exprCase(node.start, ret);
      const end = exprCase(node.end, ret);
      const step = node.step ? exprCase(node.step, ret) : null;
      return f(
        start == node.start && end == node.end && step === node.step
          ? node
          : rangeExpression(start, end, step)
      );
    },
    rlit: f,
    slit: f,
    texp: (node: TernaryExpression): Expression => {
      const cond = exprCase(node.cond, ret);
      const yes = exprCase(node.yes, ret);
      const no = exprCase(node.no, ret);
      return f(
        cond === node.cond && yes === node.yes && no === node.no
          ? node
          : ternaryExpression(cond, yes, no)
      );
    },
    uexp: (node: UnaryExpression): Expression => {
      const rhs = exprCase(node.rhs, ret);
      return f(
        rhs === node.rhs
          ? node
          : unaryExpr(node.op, node.elementwise, rhs, null)
      );
    },
    ulit: f,
  };
  return exprCase(expr, ret);
}
