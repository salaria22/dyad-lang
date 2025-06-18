import { Expression } from "@juliacomputing/dyad-ast";
import { EquationInstance } from "../instantiate/equation.js";
import { assertUnreachable } from "@juliacomputing/dyad-common";

export function unparseMTKEquation(eq: EquationInstance): string {
  return `${unparseMTKExpression(eq.lhs)} ~ ${unparseMTKExpression(eq.rhs)}`;
}

export function unparseDAEEquation(eq: EquationInstance): string {
  return `equation!((${unparseDAEExpression(eq.lhs)}) - (${unparseDAEExpression(
    eq.rhs
  )}))`;
}

export function unparseModelicaEquation(eq: EquationInstance): string {
  return `${unparseModelicaExpression(eq.lhs)} = ${unparseModelicaExpression(
    eq.rhs
  )}`;
}

export function unparseDAEExpression(expr: Expression): string {
  switch (expr.type) {
    case "arr": {
      return `[${expr.contents.map(unparseDAEExpression).join(", ")}]`;
    }
    case "bexp": {
      let op: string = expr.op;
      if (op === "and") {
        op = "&&";
      }
      if (op === "or") {
        op = "||";
      }
      return `${unparseDAEExpression(expr.lhs)} ${op}${
        expr.elementwise ? "." : ""
      } ${unparseDAEExpression(expr.rhs)}`;
    }
    case "blit": {
      return `${expr.value}`;
    }
    case "call": {
      const pos = expr.positional.map(unparseDAEExpression);
      const kw = Object.entries(expr.keyword).map(
        ([k, v]) => `${k}=${unparseDAEExpression(v)}`
      );
      let fname = unparseDAEExpression(expr.func);

      // This changes the der operator in Dyad to the `D` operator in DAE
      if (fname === "der") {
        fname = "ddt";
        return `${fname}(${[...pos, ...kw].join(", ")})`;
      } else {
        return `__${fname}Params(${[...pos, ...kw].join(", ")})()`;
      }
    }
    case "cref": {
      return expr.elems
        .map((ref) => {
          const dims = ref.indices.map((d) => `[${unparseDAEExpression(d)}]`);
          return `${ref.name === "time" ? "sim_time()" : ref.name}${dims.join(
            ""
          )}`;
        })
        .join(".");
    }
    case "ilit": {
      // TODO: remove floating-point hack (after fixing DAECompiler ϕ-node bug
      //       and/or updating codegen to implement desired conversion semantics)
      return `${expr.value}.`;
    }
    case "range": {
      if (expr.step) {
        return `${unparseDAEExpression(expr.start)}:${unparseDAEExpression(
          expr.step
        )}:${unparseDAEExpression(expr.end)}`;
      } else {
        return `${unparseDAEExpression(expr.start)}:${unparseDAEExpression(
          expr.end
        )}`;
      }
    }
    case "rlit": {
      if (Number.isInteger(expr.value)) {
        return `${expr.value}.`;
      }
      return `${expr.value}`;
    }
    case "slit": {
      return `"${expr.value}"`;
    }
    case "texp": {
      return `ifelse(${unparseDAEExpression(expr.cond)}, ${unparseDAEExpression(
        expr.yes
      )}, ${unparseDAEExpression(expr.no)})`;
    }
    case "paren": {
      return `(${unparseDAEExpression(expr.expr)})`;
    }
    case "uexp": {
      return `${expr.op}${expr.elementwise ? "." : ""}${unparseDAEExpression(
        expr.rhs
      )}`;
    }
    case "ulit": {
      return `nothing`;
    }
    /* istanbul ignore next */
    default:
      assertUnreachable(expr);
  }
}

export function unparseMTKExpression(expr: Expression): string {
  switch (expr.type) {
    case "arr": {
      return `[${expr.contents.map(unparseMTKExpression).join(", ")}]`;
    }
    case "bexp": {
      let op: string = expr.op;
      if (op === "and") {
        op = "&";
      }
      if (op === "or") {
        op = "|";
      }
      if (op === "|" || op === "&") {
        return `(${unparseMTKExpression(expr.lhs)}) ${op}${
          expr.elementwise ? "." : ""
        } (${unparseMTKExpression(expr.rhs)})`;
      }
      return `${unparseMTKExpression(expr.lhs)} ${op}${
        expr.elementwise ? "." : ""
      } ${unparseMTKExpression(expr.rhs)}`;
    }
    case "blit": {
      return `${expr.value}`;
    }
    case "call": {
      const pos = expr.positional.map(unparseMTKExpression);
      const kw = Object.entries(expr.keyword).map(
        ([k, v]) => `${k}=${unparseMTKExpression(v)}`
      );
      let fname = unparseMTKExpression(expr.func);

      // This changes the der operator in Dyad to the `D` operator in MTK
      if (fname === "der") {
        fname = "D";
      }

      return `${fname}(${[...pos, ...kw].join(", ")})`;
    }
    case "cref": {
      return expr.elems
        .map((ref) => {
          const dims = ref.indices.map((d) => `[${unparseMTKExpression(d)}]`);
          return `${ref.name === "time" ? "t" : ref.name}${dims.join("")}`;
        })
        .join(".");
    }
    case "ilit": {
      return `${expr.value}`;
    }
    case "range": {
      if (expr.step) {
        return `${unparseMTKExpression(expr.start)}:${unparseMTKExpression(
          expr.step
        )}:${unparseMTKExpression(expr.end)}`;
      } else {
        return `${unparseMTKExpression(expr.start)}:${unparseMTKExpression(
          expr.end
        )}`;
      }
    }
    case "rlit": {
      if (Number.isInteger(expr.value)) {
        return `${expr.value}.`;
      }
      return `${expr.value}`;
    }
    case "slit": {
      return `"${expr.value}"`;
    }
    case "texp": {
      return `ifelse(${unparseMTKExpression(expr.cond)}, ${unparseMTKExpression(
        expr.yes
      )}, ${unparseMTKExpression(expr.no)})`;
    }
    case "paren": {
      return `(${unparseMTKExpression(expr.expr)})`;
    }
    case "uexp": {
      return `${expr.op}${expr.elementwise ? "." : ""}${unparseMTKExpression(
        expr.rhs
      )}`;
    }
    case "ulit": {
      return `nothing`;
    }
    /* istanbul ignore next */
    default:
      assertUnreachable(expr);
  }
}

export function unparseModelicaExpression(expr: Expression): string {
  switch (expr.type) {
    case "arr": {
      return `[${expr.contents.map(unparseModelicaExpression).join(", ")}]`;
    }
    case "bexp": {
      return `${unparseModelicaExpression(expr.lhs)} ${expr.op}${
        expr.elementwise ? "." : ""
      } ${unparseModelicaExpression(expr.rhs)}`;
    }
    case "blit": {
      return `${expr.value}`;
    }
    case "call": {
      const pos = expr.positional.map(unparseModelicaExpression);
      const kw = Object.entries(expr.keyword).map(
        ([k, v]) => `${k}=${unparseModelicaExpression(v)}`
      );
      let fname = unparseModelicaExpression(expr.func);

      return `${fname}(${[...pos, ...kw].join(", ")})`;
    }
    case "cref": {
      return expr.elems
        .map((ref) => {
          const dims = ref.indices.map(
            (d) => `[${unparseModelicaExpression(d)}]`
          );
          return `${ref.name}${dims.join("")}`;
        })
        .join(".");
    }
    case "ilit": {
      return `${expr.value}`;
    }
    case "range": {
      if (expr.step) {
        return `${unparseDAEExpression(expr.start)}:${unparseDAEExpression(
          expr.step
        )}:${unparseDAEExpression(expr.end)}`;
      } else {
        return `${unparseDAEExpression(expr.start)}:${unparseDAEExpression(
          expr.end
        )}`;
      }
    }
    case "rlit": {
      return `${expr.value}`;
    }
    case "slit": {
      return `"${expr.value}"`;
    }
    case "texp": {
      return `if ${unparseModelicaExpression(
        expr.cond
      )} then ${unparseModelicaExpression(
        expr.yes
      )} else ${unparseModelicaExpression(expr.no)}`;
    }
    case "paren": {
      return `(${unparseModelicaExpression(expr.expr)})`;
    }
    case "uexp": {
      return `${expr.op}${
        expr.elementwise ? "." : ""
      }${unparseModelicaExpression(expr.rhs)}`;
    }
    case "ulit": {
      return `nothing`;
    }
    /* istanbul ignore next */
    default:
      assertUnreachable(expr);
  }
}
