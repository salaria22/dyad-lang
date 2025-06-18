import { Workspace } from "../workspace.js";
import { InMemoryLibraryProvider, projectKey } from "../../providers/index.js";
import {
  getDefinitionRelations,
  getFileEntity,
  getModuleEntity,
  queryType,
  resolveType,
  resolveVariableType,
  workspaceSelector,
} from "../index.js";
import {
  QualifiedType,
  isComponentDefinition,
  qualifiedType,
  sourceKey,
  createToken,
  hasExpression,
} from "@juliacomputing/dyad-ast";
import { addLibrary, projectRLC } from "../../codegen/testing.js";
import {
  assertFailed,
  assertHasResult,
  assertJust,
  electricalComponents,
  electricalConnector,
  electricalTypes,
} from "../utils.test.js";
import { consumer_sources } from "../../codegen/samples/consumer.js";
import { instantiateModel } from "../../instantiate/model.js";
import { rlc_sources } from "../../codegen/samples/rlc.js";
import { infiniteRecursionType } from "../errors.js";
import { resolveScopes } from "../selectors/scopes.js";
import { baseLibraryName } from "@juliacomputing/dyad-common";

const infiniteRecursion = `type Infinity = Infinity(max=100)`;

function simpleType(n: string): QualifiedType {
  return qualifiedType([createToken(n, null)], {}, null);
}

describe("Test scoping", () => {
  const loadAll = async (opts?: {
    includeTypes?: boolean;
    includeInfinity?: boolean;
  }) => {
    const includeTypes = opts?.includeTypes ?? true;
    const includeInfinity = opts?.includeInfinity ?? false;

    const workspace = await Workspace.create();
    const RLC = new InMemoryLibraryProvider();
    await RLC.set(projectKey, projectRLC);
    const id = await workspace.registerProvider(RLC);
    await workspace.waitForId(id);

    if (includeTypes) {
      await RLC.set(sourceKey("types.dyad", []), electricalTypes);
    }
    if (includeInfinity) {
      await RLC.set(sourceKey("infinity.dyad", []), infiniteRecursion);
    }
    await RLC.set(sourceKey("pin.dyad", []), electricalConnector);
    const txn = await RLC.set(
      sourceKey("components.dyad", []),
      electricalComponents
    );
    await workspace.waitForId(txn.transactionId);

    return workspace;
  };
  test("Test scoping", async () => {
    const workspace = await loadAll();

    const ground = assertJust(workspace.query(queryType("RLC", [], "Ground")));
    const entities = workspace.query(getDefinitionRelations(ground));
    const scopes = assertHasResult(workspace.query(resolveScopes(entities)));
    const fileEntity = workspace.query(getFileEntity(scopes.file));
    expect(fileEntity).toEqual("urn:parsedfile:RLC::components.dyad");
    const modEntity = workspace.query(getModuleEntity(scopes.mod));
    expect(modEntity).toEqual("urn:module:RLC:");
    expect(scopes.root).toEqual(workspace.query(workspaceSelector));

    workspace.close();
  });
  test("Test undefined symbol checking", async () => {
    /** Create the workspace */
    const workspace = await loadAll({ includeTypes: false });
    try {
      /** Extract the `Ground` model from the RLC library */
      const gdef = assertJust(workspace.query(queryType("RLC", [], "Ground")));
      /** Now resolve the `Pin` name in the context of the `Ground` definition */
      const pinType = assertHasResult(
        workspace.query(resolveType([createToken("Pin", null)], gdef, []))
      );
      /** Ensure it resolves to a structured connector */
      expect(pinType.resolves).toEqual("strcon");
      if (pinType.resolves === "strcon") {
        /** Now resolve a fully qualified type */
        assertHasResult(
          // This resolves from the explicitly qualified "Base" (Dyad) package
          workspace.query(
            resolveType(
              [
                createToken(baseLibraryName, null),
                createToken("Voltage", null),
              ],
              pinType.def,
              []
            )
          )
        );
        /** Now resolve the type of the variable `time` in the context of the `Pin` definition */
        const time = assertHasResult(
          workspace.query(resolveVariableType("time", pinType.def))
        );
        /** It should resolve to a `con` */
        expect(time.kind).toEqual("con");
        if (time.kind === "con") {
          const t = time.type;
          /** Examine the type of the `time` variable */
          expect(t.resolves).toEqual("scalar");
          if (t.resolves === "scalar") {
            /** It should have units and that value should be `"s"` */
            const units = t.mods["units"];
            expect(units).toBeDefined();
            expect(hasExpression(units)).toEqual(true);
            if (hasExpression(units)) {
              expect(units.expr.type).toEqual("slit");
              if (units.expr.type === "slit") {
                expect(units.expr.value).toEqual("s");
              }
            }
          }
        }

        /** Now resolve `Voltage` the non-fully qualified version */
        assertHasResult(
          workspace.query(
            resolveType([createToken("Voltage", null)], pinType.def, [])
          )
        );
        /** Now try to find a non-existant type */
        assertFailed(
          workspace.query(
            resolveType([createToken("NonExistantType", null)], pinType.def, [])
          )
        );
      }
    } finally {
      workspace.close();
    }
  });
  test("Test builtin type resolution", async () => {
    const workspace = await loadAll({ includeTypes: true });

    const gdef = assertJust(workspace.query(queryType("RLC", [], "Ground")));
    const realType = assertHasResult(
      workspace.query(resolveType(simpleType("Real").name, gdef, []))
    );
    expect(realType.resolves).toEqual("scalar");
    const barType = assertHasResult(
      workspace.query(resolveType(simpleType("Bar").name, gdef, []))
    );
    expect(barType.resolves).toEqual("scalar");
  });
  test("Test infinite recursion checking", async () => {
    const workspace = await loadAll({
      includeTypes: true,
      includeInfinity: true,
    });
    const gdef = assertJust(workspace.query(queryType("RLC", [], "Ground")));
    assertHasResult(
      workspace.query(resolveType(simpleType("Voltage").name, gdef, []))
    );
    assertFailed(
      workspace.query(resolveType(simpleType("Infinity").name, gdef, [])),
      infiniteRecursionType
    );

    workspace.close();
  });
  test("Test cross-referencing between libraries", async () => {
    const workspace = await Workspace.create();

    await addLibrary("RLC", workspace, rlc_sources);
    await addLibrary("Consumer", workspace, consumer_sources);

    const gdef = assertJust(workspace.query(queryType("RLC", [], "Ground")));
    assertHasResult(
      workspace.query(resolveType(simpleType("Voltage").name, gdef, []))
    );
    assertHasResult(
      workspace.query(
        resolveType(
          [createToken(baseLibraryName, null), createToken("Voltage", null)],
          gdef,
          []
        )
      )
    );

    assertHasResult(
      workspace.query(
        resolveType(
          [createToken("RLC", null), createToken("Resistor", null)],
          gdef,
          []
        )
      )
    );

    const system = workspace.query(queryType("Consumer", [], "RLCModel"));
    const model = assertJust(system);
    expect(isComponentDefinition(model)).toEqual(true);
    if (isComponentDefinition(model)) {
      const inst = instantiateModel(
        model,
        {},
        null,
        workspace.query.bind(workspace)
      );
      expect(inst.problems()).toHaveLength(0);
    }

    workspace.close();
  });
  test("Test observing an instance", async () => {
    const workspace = await loadAll({ includeTypes: true });

    workspace.close();
  });
});
