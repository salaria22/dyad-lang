import { Lines } from "@juliacomputing/dyad-common";
import { codeFence, inlineCode } from "./primitives.js";
import { ModelInstance, normalizeDefinition } from "../../index.js";
import { ComponentDefinition, DyadLibrary } from "@juliacomputing/dyad-ast";

export function TestCasesSection(
  lib: DyadLibrary,
  instance: ModelInstance,
  def: ComponentDefinition
): string {
  const lines = new Lines("");
  const testModel = def.name.value;

  /** This is the part of the eval block that is only specific to the model, not the test case. */
  const code_setup = new Lines("");
  code_setup.add(`using ${lib.name}`);
  code_setup.add("using ModelingToolkit, OrdinaryDiffEqDefault");
  code_setup.add("using Plots");
  code_setup.add("using CSV, DataFrames");
  code_setup.add("");
  code_setup.add(
    `snapshotsdir = joinpath(dirname(dirname(pathof(${lib.name}))), "test", "snapshots")`
  );

  const normalized = normalizeDefinition(instance.definition_metadata);
  const entries = Object.entries(normalized.Dyad.tests);

  if (entries.length === 0) {
    lines.add("## Test Cases");
    lines.add("", "No test cases defined.", "");
    return lines.toString();
  }

  lines.add("## Test Cases");
  lines.add(codeFence("@setup tests", code_setup.toString()));
  lines.add("");

  /** Now we loop over the test cases... */
  for (const [caseName, test] of entries) {
    const params = Object.entries(test.params)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    const ics = Object.entries(test.initial)
      .map(([k, v]) => `model_${caseName}.${k} => ${v}`)
      .join(", ");

    const code_case_setup = new Lines("");
    code_case_setup.add(
      `@mtkbuild model_${caseName} = ${testModel}(${params})`
    );
    code_case_setup.add(`u0_${caseName} = [${ics}]`);
    code_case_setup.add(
      `prob_${caseName} = ODEProblem(model_${caseName}, u0_${caseName}, (${test.start}, ${test.stop}))`
    );
    code_case_setup.add(
      `sol_${caseName} = solve(prob_${caseName}${test.solver !== "DefaultODEAlgorithm" ? `, ${test.solver}()` : ""})`
    );

    lines.add(`### Test Case ${inlineCode(caseName)}`);
    lines.add(codeFence("@setup tests", code_case_setup.toString()));

    // TODO: Add anything with an initial or final value
    const signals = test.expect.signals;
    let signalIndex = 0;
    for (signalIndex = 0; signalIndex < signals.length; signalIndex++) {
      const signal = test.expect.signals[signalIndex];
      const initial = test.expect.initial[signal];
      const final = test.expect.final[signal];
      // const desc = `Signal ${inlineCode(signal)} for test ${inlineCode(
      //   caseName
      // )} of ${inlineCode(testModel)}`;

      const code = new Lines("");

      code.add(
        `df_${caseName} = DataFrame(:t => sol_${caseName}[:t], :actual => sol_${caseName}[model_${caseName}.${signal}])`
      );
      code.add(
        `dfr_${caseName} = try CSV.read(joinpath(snapshotsdir, "${testModel}_${caseName}_sig${signalIndex}.ref"), DataFrame); catch e; nothing; end`
      );
      // figs.add(`CSV.write("SecondOrderTest_case1_sig0.ref", dfr)`);
      code.add(
        `plt = plot(sol_${caseName}, idxs=[model_${caseName}.${signal}], width=2, label="Actual value of ${signal}")`
      );
      code.add(`if !isnothing(dfr_${caseName})`);
      code.add(
        `  scatter!(plt, dfr_${caseName}.t, dfr_${caseName}.expected, mc=:red, ms=3, label="Expected value of ${signal}")`
      );
      code.add("end");
      if (initial !== undefined) {
        code.add(
          `scatter!(plt, [df_${caseName}.t[1]], [${initial}], label="Initial Condition for ${inlineCode(
            signal
          )}")`
        );
      }
      if (final !== undefined) {
        code.add(
          `scatter!(plt, [df_${caseName}.t[end]], [${final}], label="Final Condition for ${inlineCode(
            signal
          )}")`
        );
      }
      code.add("");
      lines.add(codeFence("@setup tests", code.toString()));
      lines.add(codeFence("@example tests", "plt"));
      lines.add("");
    }
  }

  return lines.toString();
}
