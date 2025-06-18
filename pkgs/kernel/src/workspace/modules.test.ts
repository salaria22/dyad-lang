import {
  builtinTypes,
  createToken,
  isComponentDefinition,
  isScalarTypeDefinition,
  sourceKey,
} from "@juliacomputing/dyad-ast";
import {
  InMemoryLibraryProvider,
  LibraryProvider,
} from "../providers/index.js";
import { Workspace } from "./workspace.js";
import {
  builtinEntity,
  definitionEntity,
  queryRawFiles,
  queryType,
  resolveType,
} from "./index.js";
import {
  assertFailed,
  assertHasResult,
  assertIs,
  assertJust,
  loadModulesFromFS,
} from "./utils.test.js";
import { lastValue } from "../providers/last.js";

import { instantiateModel } from "../instantiate/model.js";
import { SnapshotHandler } from "../codegen/testing.js";
import { emitComponent } from "../codegen/mtk/model.js";
import { infiniteRecursionType } from "./errors.js";
import { lookupQualifiedType, typeSymbols } from "./selectors/symbols.js";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import { firstValueFrom } from "rxjs";
import { flattenDefinitionEntity } from "./selectors/flatten.js";
import { getDefinitionNode } from "./selectors/nodes.js";
import { baseLibraryName } from "@juliacomputing/dyad-common";

const lib1 = `type Lib1Type = Real(min=0)`;
const lib2 = `using Lib1: Lib1Type

type Lib2Type = Lib1Type(max=100)`;

const circular1 = `using Cir2: Cir2Type; type Cir1Type = Cir2Type(min=0)`;
const circular2 = `using Cir1: Cir1Type; type Cir2Type = Cir1Type(max=0)`;

describe("Test semantics related to modules", () => {
  test("Test importing of Dyad components from other libraries", async () => {
    const { workspace } = await loadWorkspaceWithModules({
      Lib1: { main: lib1 },
      Lib2: { main: lib2 },
    });

    const type2 = assertJust(
      workspace.query(queryType("Lib2", [], "Lib2Type"))
    );
    const resolved = assertHasResult(
      workspace.query(resolveType([createToken("Lib2Type", null)], type2, []))
    );
    expect(resolved.resolves === "scalar");
    if (resolved.resolves === "scalar") {
      expect(resolved.mods["min"]).toBeDefined();
      expect(resolved.mods["max"]).toBeDefined();
      expect(resolved.base.name.length).toEqual(1);
      expect(resolved.base.name[0].value).toEqual("Real");
    }
  });
  test("Test cross-module circular references", async () => {
    const { workspace } = await loadWorkspaceWithModules({
      Cir1: { main: circular1 },
      Cir2: { main: circular2 },
    });

    const type2 = assertJust(
      workspace.query(queryType("Cir2", [], "Cir2Type"))
    );
    assertFailed(
      workspace.query(resolveType([createToken("Cir2Type", null)], type2, [])),
      infiniteRecursionType
    );

    const cirtype = definitionEntity("Cir2", [], "Cir2Type");

    assertFailed(
      workspace.query(flattenDefinitionEntity(cirtype, new Set())),
      "InfiniteRecursion"
    );
  });
  test("Test querying of SampleComponents", async () => {
    const { workspace } = await loadModulesFromFS({
      sample: "SampleComponents",
    });
    try {
      const hello = definitionEntity("SampleComponents", [], "Hello");
      const node = assertHasResult(workspace.query(getDefinitionNode(hello)));
      const rels = workspace.query(({ attrs }) => attrs.getRelations(node));
      expect(rels).toBeDefined();
      expect(rels).toMatchSnapshot();
      expect(rels.self).toEqual(hello);

      const syms = assertHasResult(workspace.query(typeSymbols(node)));
      expect(syms).toBeDefined();
      expect(syms).toMatchSnapshot();
      expect(syms.base["Temperature"]).toBeDefined();

      const qtype = assertHasResult(
        workspace.query(lookupQualifiedType(builtinTypes[0].name, node))
      );
      expect(qtype).toEqual(builtinEntity("Real"));

      const temp = definitionEntity(baseLibraryName, [], "Temperature");

      const temp1 = assertHasResult(
        workspace.query(
          lookupQualifiedType([createToken("Temperature", null)], node)
        )
      );
      expect(temp1).toEqual(temp);

      const temp2 = assertHasResult(
        workspace.query(
          lookupQualifiedType(
            [
              createToken(baseLibraryName, null),
              createToken("Temperature", null),
            ],
            node
          )
        )
      );
      expect(temp2).toEqual(temp);

      const ftemp = assertIs(
        assertHasResult(
          workspace.query(flattenDefinitionEntity(temp, new Set()))
        ),
        isScalarTypeDefinition
      );
      expect(ftemp.base.name[0].value).toEqual("Real");
      expect(ftemp).toMatchSnapshot();
      expect(unparseDyad(ftemp)).toEqual(
        `type Temperature = Real(statePriority=0, min=0, units="K", displayUnits="degC")`
      );

      const b1s = definitionEntity("SampleComponents", [], "Base1");

      const b1n = workspace.query(getDefinitionNode(b1s));
      assertHasResult(b1n);
      const b1f = flattenDefinitionEntity(b1s, new Set());
      const b10 = await firstValueFrom(workspace.follow(b1f));
      assertHasResult(b10);
      const b1e = workspace.query(b1f);
      assertHasResult(b1e);
      // Skipping this for now, but this is the test for flattened
      // component definitions

      const mq = flattenDefinitionEntity(
        definitionEntity("SampleComponents", [], "Multi"),
        new Set()
      );

      const he = workspace.query(getDefinitionNode(hello));
      assertHasResult(he);

      const mqr = workspace.query(mq);
      const multi = assertIs(assertHasResult(mqr), isComponentDefinition);
      expect(multi).not.toBeNull();
      expect(multi).toMatchSnapshot();
      expect(unparseDyad(multi)).toMatchSnapshot();
    } finally {
      workspace.close();
    }
  });
  test("Test querying of modules", async () => {
    const { workspace, foo } = await loadModulesFromFS({
      foo: "FooComponents",
      bar: "BarComponents",
    });
    try {
      const mods = lastValue(foo.modules());
      expect(mods).toEqual([[], ["Mod1"], ["Mod2"]]);

      const a = assertJust(
        workspace.query(queryType("FooComponents", [], "A"))
      );
      expect(isComponentDefinition(a)).toEqual(true);
      if (isComponentDefinition(a)) {
        const ia = assertHasResult(
          instantiateModel(a, {}, null, workspace.query.bind(workspace))
        );
        expect(ia.parameters["x1"].default).not.toEqual(undefined);
        expect(ia.parameters["x2"].default).not.toEqual(undefined);
        expect(ia.parameters["x3"].default).not.toEqual(undefined);
        expect(ia.parameters["x4"].default).not.toEqual(undefined);

        const handler = new SnapshotHandler([[]]);
        try {
          await handler.startModule([]);
          await emitComponent(
            ia,
            workspace.query.bind(workspace),
            [],
            "",
            handler,
            {
              includeUnits: false,
            }
          );
        } finally {
          await handler.close();
        }
      }

      const compc = assertJust(
        workspace.query(queryType("FooComponents", ["Mod1"], "ComponentC"))
      );

      expect(isComponentDefinition(compc)).toEqual(true);
      if (isComponentDefinition(compc)) {
        const inst = instantiateModel(
          compc,
          {},
          null,
          workspace.query.bind(workspace)
        );
        assertHasResult(inst, false);
      }

      const compd = assertJust(
        workspace.query(queryType("FooComponents", ["Mod2"], "ComponentD"))
      );

      const bartype = assertJust(
        workspace.query(queryType("BarComponents", [], "BarType"))
      );

      expect(isScalarTypeDefinition(bartype));
      expect(isComponentDefinition(compd)).toEqual(true);
      if (isComponentDefinition(compd)) {
        const inst = instantiateModel(
          compd,
          {},
          null,
          workspace.query.bind(workspace)
        );
        assertHasResult(inst, false);
      }
    } finally {
      await workspace.close();
    }
  });
});

async function loadWorkspaceWithModules(
  modules: Record<string, Record<string, string>>
) {
  const workspace = await Workspace.create();
  const providers: Record<string, LibraryProvider> = {};

  let last: string | null = null;
  for (const [module, contents] of Object.entries(modules)) {
    const provider = new InMemoryLibraryProvider({
      name: module,
      authors: [],
      version: "0.0.1",
      uuid: `abc-${module}`,
    });
    await workspace.registerProvider(provider);

    for (const [file, text] of Object.entries(contents)) {
      const txn = await provider.set(sourceKey(file, []), text);
      last = txn.transactionId;
    }
  }
  if (last !== null) {
    await workspace.waitForId(last);
  }

  const files = workspace.query(queryRawFiles());
  const issues = files.flatMap((file) => file.problems);

  return { workspace, providers, issues };
}
