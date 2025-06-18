import { StringOutput } from "./modelica/output.js";
import {
  negElectricalPin,
  posElectricalPin,
  rlc_modelica_results,
  rlc_sources,
} from "./samples/rlc.js";
import {
  computeHashes,
  isModuleEntity,
  queryLibrary,
  queryModule,
  queryType,
} from "../workspace/index.js";
import { parseDyad } from "@juliacomputing/dyad-parser";

import debug from "debug";
import { machine_sources } from "./samples/machine.js";
import { Modelica, MTK /*, DAECompiler */ } from "./index.js";
import { addLibrary, loadWorkspace, SnapshotHandler } from "./testing.js";
import { instantiateModel, stringifyProblem, Workspace } from "../index.js";
import {
  DyadLibrary,
  assetKey,
  isAnalysisDefinition,
  isComponentDefinition,
  sourceKey,
} from "@juliacomputing/dyad-ast";
import { buf2str, Problem, problemMessage } from "@juliacomputing/dyad-common";
import {
  assertHasResult,
  assertJust,
  loadModulesFromFS,
} from "../workspace/utils.test.js";
import { instantiateAnalysis } from "../instantiate/analysis.js";
import { getModuleNode } from "../workspace/selectors/nodes.js";
import { getEntity } from "../workspace/selectors/entities.js";

const outputLog = debug("codegen:output");
const mutateLog = debug("obs:test");

const externalCurrent = `
external component StepCurrent
  p = Pin()
  n = Pin()
  parameter start::Time
  parameter i_init::Current
  parameter i_final::Current
end`;

describe("Test ModelingToolkit code generation", () => {
  test("Generate MTK code for RLC library", async () => {
    const generate = (workspace: Workspace, library: DyadLibrary) => {
      const problems = MTK.generateMTKCode(
        workspace,
        library,
        [],
        new SnapshotHandler([[]])
      );

      const analysis = assertJust(
        workspace.query(queryType("RLC", [], "RLCTransient"))
      );
      expect(analysis.kind).toEqual("adef");
      if (isAnalysisDefinition(analysis)) {
        assertHasResult(
          instantiateAnalysis(analysis, {}, workspace.query.bind(workspace))
        );
      }
      return problems;
    };
    const problems = await runTest("RLC", generate, {
      ...rlc_sources,
      "current.dyad": externalCurrent,
    });
    expect(problems).toEqual([]);
  });

  test("Generate MTK code that requires imports", async () => {
    const { workspace } = await loadWorkspace("RLC", rlc_sources);
    await addLibrary("Main", workspace, {
      "main.dyad": `
using RLC: RLCModel

component MyRLC
  extends RLCModel
end`,
    });
    const mainlib = workspace.query(queryLibrary("Main"));
    const problems = await MTK.generateMTKCode(
      workspace,
      assertJust(mainlib),
      [],
      new SnapshotHandler([[]])
    );
    expect(problems).toHaveLength(0);
  });

  test(
    "Generate MTK code for SampleComponents",
    generateLibrary("SampleComponents", async (workspace: Workspace) => {
      // Modify definition of a nested component
      const provider = assertJust(
        workspace.getProvider("2dfc82bd-6774-478f-8551-f1d76c608b65")
      );
      const key = sourceKey("hello.dyad", []);
      const contents = await provider.get(key);
      const id = await provider.set(sourceKey("hello.dyad", []), contents);
      await workspace.waitForId(id.transactionId);
    })
  );

  test(
    "Generate MTK code for CustomAnalyses",
    generateLibrary("CustomAnalyses", async (workspace: Workspace) => {
      const lv = assertJust(
        workspace.query(queryType("CustomAnalyses", [], "LotkaVolterra"))
      );
      expect(isComponentDefinition(lv)).toEqual(true);
      if (isComponentDefinition(lv)) {
        assertHasResult(
          instantiateModel(lv, {}, null, workspace.query.bind(workspace))
        );
      }
    })
  );

  test(
    "Generate MTK code for CommonTest",
    generateLibrary("CommonTests", async (workspace: Workspace) => {
      // Modify definition of a nested component
      const provider = assertJust(
        workspace.getProvider("d6c50edf-f3d5-461d-8851-83afa9b4ac0e")
      );
      const key = sourceKey("reservoir.dyad", []);
      const contents = await provider.get(key);
      let mod = assertJust(workspace.query(queryModule("CommonTests", [])));
      let res = assertJust(
        workspace.query(queryType("CommonTests", [], "Reservoir"))
      );
      const modEntity = workspace.query(getEntity(mod));
      expect(modEntity).toEqual("urn:module:CommonTests:");
      if (isModuleEntity(modEntity)) {
        const moduleSelector = getModuleNode(modEntity);
        const m = assertHasResult(workspace.query(moduleSelector));
        expect(m === mod).toEqual(true);
      }
      const initialModuleHash = computeHashes(mod);
      const initialReservoirHash = computeHashes(res);
      const id = await provider.set(
        sourceKey("reservoir.dyad", []),
        buf2str(contents)
        // "# Sample docstring\n" + buf2str(contents)
      );
      await workspace.waitForId(id.transactionId);
      mutateLog("Updated file for reservoir.dyad");
      mod = assertJust(workspace.query(queryModule("CommonTests", [])));
      res = assertJust(
        workspace.query(queryType("CommonTests", [], "Reservoir"))
      );
      const finalModuleHash = computeHashes(mod);
      const finalReservoirHash = computeHashes(res);
      expect(finalModuleHash).toEqual(initialModuleHash);
      expect(finalModuleHash.contentHash).not.toEqual(
        finalModuleHash.semanticHash
      );
      expect(finalReservoirHash).toEqual(initialReservoirHash);
      expect(finalReservoirHash.contentHash).not.toEqual(
        finalReservoirHash.semanticHash
      );
    }),
    100000
  );
});

describe("Test Modelica code generation", () => {
  test("Generate Modelica code for RLC library", async () => {
    const output = new StringOutput();
    const generate = async (workspace: Workspace, library: DyadLibrary) => {
      const problems = generator.generate(
        workspace.query.bind(workspace),
        library,
        output
      );
      output.close();
      return problems;
    };

    const generator = new Modelica.ModelicaGenerator();
    await runTest("RLC", generate, rlc_sources);

    // Mismatch in number of expected results files"
    expect(Object.keys(rlc_modelica_results)).toEqual(
      Object.keys(output.results)
    );
    for (const [name, contents] of Object.entries(output.results)) {
      outputLog("File %s contains %s", name, contents);
      // Results for the file referenced by `name` did not match
      expect(contents.trim()).toEqual(rlc_modelica_results[name].trim());
    }
  });
});

describe("Test state machine parsing", () => {
  test.skip("Parse state machine definition", async () => {
    const input = machine_sources["machine.dyad"];
    const foo = parseDyad(input, "machine.dyad", null);
    for (const e of foo.lexErrors) {
      console.error(problemMessage(e));
    }
    for (const e of foo.parseErrors) {
      console.error(problemMessage(e));
    }
    expect(foo.lexErrors).toHaveLength(0);
    expect(foo.parseErrors).toHaveLength(0);
    expect(foo.cst).not.toBeNull();
  });
});

async function runTest(
  libraryName: string,
  generate: (
    workspace: Workspace,
    library: DyadLibrary
  ) => Promise<Array<Problem<unknown>>>,
  sources: Record<string, string>
): Promise<Problem[]> {
  /* Create a workspace with a single library */
  const { workspace, inmem } = await loadWorkspace(libraryName, sources);

  // Add assets
  await inmem.set(assetKey("p_pin.svg"), posElectricalPin);
  await inmem.set(assetKey("n_pin.svg"), negElectricalPin);

  const result = workspace.query(queryLibrary(libraryName));
  expect(result.isJust()).toEqual(true);
  const library = result.unsafeCoerce();
  expect(library.kind).toEqual("lib");
  if (library.kind === "lib") {
    const problems = await generate(workspace, library);

    expect(problems).toEqual([]);
    return problems;
  }
  return [];
}
function generateLibrary(
  libname: string,
  f: (workspace: Workspace) => Promise<void>
) {
  return async () => {
    const generate = (workspace: Workspace, library: DyadLibrary) => {
      const problems = MTK.generateMTKCode(
        workspace,
        library,
        [],
        new SnapshotHandler([[]])
      );

      return problems;
    };
    const { workspace } = await loadModulesFromFS({
      com: libname,
    });

    try {
      const com = assertJust(workspace.query(queryLibrary(libname)));

      const problems = await generate(workspace, com);
      expect(problems.map(stringifyProblem)).toEqual([]);

      await f(workspace);
      const com2 = assertJust(workspace.query(queryLibrary(libname)));

      const problems2 = await generate(workspace, com2);
      expect(problems2.map(stringifyProblem)).toEqual([]);
    } finally {
      workspace.close();
    }
  };
}
