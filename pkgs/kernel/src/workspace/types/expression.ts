import {
  ASTNode,
  BinaryExpression,
  booleanType,
  CompRef,
  Definition,
  exprCase,
  Expression,
  expressionSpan,
  FunctionCall,
  integerType,
  ParentheticalExpression,
  ProblemSpan,
  realType,
  stringType,
  TernaryExpression,
  UnaryExpression,
} from "@juliacomputing/dyad-ast";
import { Workspace } from "../workspace.js";
import { ResolvedType } from "./types.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import {
  assertUnreachable,
  failedResult,
  partialResult,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import {
  isBooleanType,
  isNumericType,
  isStringType,
  promotedType,
  resolvedScalar,
} from "./scalar.js";
import {
  booleanRequired,
  incompatibleTypes,
  invalidOperator,
} from "./errors.js";
import { problemSpan } from "../utils.js";
import { CompilerAssertionError } from "../errors.js";
import { Instance } from "../../instantiate/instance.js";
import { resolveVariableType } from "../symbols/resolve.js";

/** An instance of `ResolvedType` corresponding to a real */
const resolvedReal = successfulResult(
  resolvedScalar(realType, Nothing, null, {})
);

/** An instance of `ResolvedType` corresponding to an integer */
const resolvedInteger = successfulResult(
  resolvedScalar(integerType, Nothing, null, {})
);

/** An instance of `ResolvedType` corresponding to a boolean */
const resolvedBoolean = successfulResult(
  resolvedScalar(booleanType, Nothing, null, {})
);

/** An instance of `ResolvedType` corresponding to a string */
const resolvedString = successfulResult(
  resolvedScalar(stringType, Nothing, null, {})
);

/**
 * For a given expression, `expr`, in a given context, `context`, resolve
 * the type of that expression and return it as a `Result<ResolvedType>`.
 * @param expr
 * @param context
 * @param workspace
 * @returns
 */
export function resolveExpressionType(
  expr: Expression,
  context: Definition,
  workspace: Workspace
): Result<ResolvedType> {
  return exprCase(expr, {
    arr: (): Result<ResolvedType> => {
      // We don't have an array type yet among the resolved types
      throw new Error("Function not implemented.");
    },
    bexp: resolveBinaryExpressionType(workspace, context),
    blit: () => resolvedBoolean,
    call: resolveFunctionCallType(workspace, context),
    cref: resolveComponentReferenceType(workspace, context),
    ilit: () => resolvedInteger,
    range: () => {
      // We don't have a range type yet among the resolved types
      throw new Error("Function not implemented.");
    },
    rlit: (): Result<ResolvedType> => resolvedReal,
    paren: (node: ParentheticalExpression): Result<ResolvedType> =>
      resolveExpressionType(node.expr, context, workspace),
    slit: () => resolvedString,
    texp: resolveTernaryExpressionType(workspace, context),
    uexp: resolveUnaryExpressionType(workspace, context),
    ulit: (): Result<ResolvedType> => {
      // Currently our type system doesn't have a place for this.  I'm
      // going to leave this unimplemented but I'm wondering if we'd be
      // better off with some kind of formal Maybe/Option system rather
      // than letting undefined creep into the language (or perhaps just
      // formalize the notion of undefined more than it is in other
      // languages)
      throw new Error("Function not implemented.");
    },
  });
}

/**
 * Helper function that resolves the type of a given function call
 * expression node
 * @param workspace
 * @param context
 * @returns
 */
function resolveFunctionCallType(_workspace: Workspace, _context: ASTNode) {
  return (_node: FunctionCall): Result<ResolvedType> => {
    return failedResult(
      new CompilerAssertionError(
        "resolveFunctionCallType",
        "Resolution of function call expressions is not yet implemented"
      )
    );
  };
}

/**
 * Helper function that resolves the type of a given component reference
 * expression node
 * @param workspace
 * @param context
 * @returns
 */
function resolveComponentReferenceType(
  workspace: Workspace,
  context: Definition
) {
  return (node: CompRef): Result<ResolvedType> => {
    // Step through each part of the component reference and try to
    // come out the other end with an instance.
    // TODO: Make this a separate function
    let cur: Maybe<Instance> = Nothing;
    for (const elem of node.elems) {
      const symbol = workspace.query(resolveVariableType(elem.name, context));
      if (elem.indices.length > 0) {
        throw new CompilerAssertionError(
          "resolveComponentReferenceType",
          "Resolving types of dereferenced expressions not yet supported"
        );
      }
      cur = Just(symbol.unsafeCoerce());
    }

    // Now, given an instance, return the ResolveType (or perhaps just the Definition?)
    return cur.caseOf({
      Just: (v) => {
        switch (v.kind) {
          case "model": {
            const def = workspace.query(v.def);
            return successfulResult<ResolvedType>({
              resolves: "cdef",
              def: def,
            });
          }
          case "comp": {
            const def = workspace.query(v.instance.def);
            return successfulResult<ResolvedType>({
              resolves: "cdef",
              def: def,
            });
          }
          default:
            return failedResult(
              new CompilerAssertionError(
                "resolveComponentReferenceType",
                `Resolving types of ${v.kind} not yet supported`
              )
            );
        }
      },
      Nothing: () => {
        return failedResult(
          new CompilerAssertionError(
            "resolveComponentReferenceType",
            "Resolving types of dereferenced expressions not yet supported"
          )
        );
      },
    });
  };
}

/**
 * Helper function that resolves the type of a given ternary expression node
 * @param workspace
 * @param context
 * @returns
 */
function resolveTernaryExpressionType(
  workspace: Workspace,
  context: Definition
) {
  return (node: TernaryExpression): Result<ResolvedType> => {
    const problems: Problem<ProblemSpan>[] = [];
    const cond = resolveExpressionType(node.cond, context, workspace);
    const yes = resolveExpressionType(node.yes, context, workspace);
    const no = resolveExpressionType(node.no, context, workspace);
    cond.ifResult((t) => {
      if (!isNumericType(t)) {
        problems.push(
          booleanRequired(
            "cond",
            `Conditional expression in ternary operator must be a boolean`,
            problemSpan(context, expressionSpan(node))
          )
        );
      }
    }, problems);
    return yes.chain((y) =>
      no.chain((n): Result<ResolvedType> => {
        if (isNumericType(y) && isNumericType(n)) {
          return partialResult(promotedType(y, n), ...problems);
        } else if (isBooleanType(y) && isBooleanType(n)) {
          return partialResult(resolvedBoolean.value, ...problems);
        } else if (isStringType(y) && isStringType(n)) {
          return partialResult(resolvedString.value, ...problems);
        } else {
          return failedResult(
            incompatibleTypes(
              "ternary",
              `Ternary operator branch expressions are incompatible`,
              problemSpan(context, expressionSpan(node))
            )
          );
        }
      })
    );
  };
}

/**
 * Helper function that resolves the type of a unary expression node
 * @param workspace
 * @param context
 * @returns
 */
function resolveUnaryExpressionType(workspace: Workspace, context: Definition) {
  return (node: UnaryExpression): Result<ResolvedType> => {
    const rhs = resolveExpressionType(node.rhs, context, workspace);
    return rhs.chain((x) => {
      switch (node.op) {
        case "+":
        case "-":
          return isNumericType(x)
            ? successfulResult(x)
            : failedResult(
                invalidOperator(
                  node.op,
                  `Unary operator ${node.op} must be applied to an expression of numeric type`,
                  problemSpan(context, expressionSpan(node))
                )
              );
        case "not":
          return isBooleanType(x)
            ? successfulResult(x)
            : failedResult(
                invalidOperator(
                  node.op,
                  `Unary operator ${node.op} must be applied to an expression of boolean type`,
                  problemSpan(context, expressionSpan(node))
                )
              );
        default:
          assertUnreachable(node.op);
      }
    });
  };
}

/**
 * Helper function that resolves the type of a binary expression node
 * @param workspace
 * @param context
 * @returns
 */
function resolveBinaryExpressionType(
  workspace: Workspace,
  context: Definition
) {
  return (node: BinaryExpression): Result<ResolvedType> => {
    const lhs = resolveExpressionType(node.lhs, context, workspace);
    const rhs = resolveExpressionType(node.rhs, context, workspace);

    return lhs.chain((l) =>
      rhs.chain((r) => {
        switch (node.op) {
          case "*":
          case "+":
          case "-":
          case "/":
          case "^":
          case "%":
            if (isNumericType(l) && isNumericType(r)) {
              return successfulResult(promotedType(l, r));
            }
            return failedResult(
              invalidOperator(
                node.op,
                `Binary operator ${node.op} can only operate on numeric types`,
                problemSpan(context, expressionSpan(node))
              )
            );
          case ">":
          case ">=":
          case "<":
          case "<=":
            if (isNumericType(l) && isNumericType(r)) {
              return resolvedBoolean;
            }
            return failedResult(
              invalidOperator(
                node.op,
                `Binary operator ${node.op} can only operate on numeric types`,
                problemSpan(context, expressionSpan(node))
              )
            );
          case "and":
          case "or":
            if (isBooleanType(l) && isBooleanType(r)) {
              return lhs;
            }
            return failedResult(
              invalidOperator(
                node.op,
                `Binary operator ${node.op} can only operate on boolean types`,
                problemSpan(context, expressionSpan(node))
              )
            );
          case "==":
          case "!=":
            if (
              (isNumericType(l) && isNumericType(r)) ||
              (isBooleanType(l) && isBooleanType(r)) ||
              (isStringType(l) && isStringType(r))
            ) {
              return resolvedBoolean;
            }

            return failedResult(
              invalidOperator(
                node.op,
                `Binary operator ${node.op} can only `,
                problemSpan(context, expressionSpan(node))
              )
            );
          default:
            assertUnreachable(node.op);
        }
      })
    );
  };
}
