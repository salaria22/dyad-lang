import {
  isConnectionInstance,
  isEquationInstance,
  ModelInstance,
  resolveSpecificType,
} from "../../instantiate/index.js";
import {
  unparseMTKExpression,
  unparseModelicaEquation,
  unparseModelicaExpression,
} from "../equation.js";
import { Output } from "./output.js";
import debug from "debug";
import { compRef, functionCall, hasExpression } from "@juliacomputing/dyad-ast";
import { objectFilterMap, Problem } from "@juliacomputing/dyad-common";
import { stringifyProblem } from "../../workspace/utils.js";
import { QueryHandler } from "../../workspace/selector.js";

const instanceLog = debug("codegen:inst");

export function emitModelicaModel(
  instance: ModelInstance,
  query: QueryHandler,
  output: Output
): void {
  output.startFile(instance.name.value);
  instanceLog("Instance of %s: %j", instance.name, instance);

  const connectors = Object.entries(instance.connectors);
  const components = Object.entries(instance.components);
  const variables = Object.entries(instance.variables);
  const parameters = Object.entries(instance.parameters);

  if (instance.doc_string === null) {
    output.writeLine(`model ${instance.name.value}`);
  } else {
    output.writeLine(
      `model ${instance.name.value} "${instance.doc_string.value
        .trim()
        .replace("\n", " ")}"`
    );
  }

  if (parameters.length > 0) {
    for (const [cn, c] of parameters) {
      const final = c.final ? `final ` : ``;
      if (c.type.resolves === "scalar") {
        const specificType = resolveSpecificType(c.type);
        output.writeLine(
          `  ${final}parameter ${specificType} ${cn}${c.default.mapOrDefault(
            (e) => ` = ${unparseMTKExpression(e)}`,
            ""
          )};`
        );
      }
    }
  }

  // Write components
  if (connectors.length + components.length > 0) {
    for (const [cn, c] of connectors) {
      output.writeLine(`  ${c.name.value} ${cn};`);
    }
    const problems: Problem[] = [];

    for (const [cn, comp] of components) {
      comp().ifResult((c) => {
        const def = query(c.instance.def);
        const args = objectFilterMap(c.mods, hasExpression, (x) => x.expr);
        const decl = functionCall(
          compRef([{ name: cn, indices: [], span: null }]),
          [],
          args,
          null
        );

        output.writeLine(
          `  ${def.name.value} ${unparseModelicaExpression(decl)};`
        );
      }, problems);
    }

    for (const prob of problems) {
      console.error(
        `Error writing Modelica components: `,
        stringifyProblem(prob)
      );
    }
  }

  if (variables.length > 0) {
    for (const [cn, c] of variables) {
      if (c.type.resolves === "scalar") {
        const specificType = resolveSpecificType(c.type);
        output.writeLine(
          `  ${specificType} ${cn}${c.default.mapOrDefault(
            unparseMTKExpression,
            ""
          )};`
        );
      }
    }
  }

  const all_equations = instance.relations.filter(isEquationInstance);

  const initial_equations = all_equations.filter((x) => x.initial);
  if (initial_equations.length > 0) {
    output.writeLine(`initial equation`);
    for (const eq of initial_equations) {
      output.writeLine(
        `  ${unparseModelicaEquation(eq)}${
          eq.doc_string ? ` "${eq.doc_string.value}"` : ""
        };`
      );
    }
  }

  output.writeLine(`equation`);
  const equations = all_equations.filter((x) => !x.initial);
  for (const eq of equations) {
    output.writeLine(
      `  ${unparseModelicaEquation(eq)}${
        eq.doc_string ? ` "${eq.doc_string.value}"` : ""
      };`
    );
  }
  const connections = instance.relations.filter(isConnectionInstance);
  for (const con of connections) {
    for (let i = 0; i < con.connectors.length - 1; i++) {
      const a = con.connectors[i];
      const b = con.connectors[i + 1];
      output.writeLine(
        `  connect(${unparseModelicaExpression(
          a
        )}, ${unparseModelicaExpression(b)})${
          con.doc_string ? ` "${con.doc_string.value}"` : ""
        };`
      );
    }
  }

  output.writeLine(`end ${instance.name.value};`);
  // FIX: Write out metadata (separate file/output channel?)

  output.endFile(instance.name.value);
}
