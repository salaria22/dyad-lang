import { definitionEntity } from "../entities/index.js";
import { resolveEntityType } from "./entity.js";
import {
  assertHasResult,
  assertIs,
  assertIsDefined,
  assertJust,
  loadModulesFromFS,
} from "../utils.test.js";
import { Workspace } from "../workspace.js";
import { EntityType } from "../newtypes/types.js";
import { isRealType } from "../newtypes/real.js";
import { isIntegerType } from "../newtypes/integer.js";
import { isFunctionType } from "../newtypes/functions.js";
import { isStructType } from "../newtypes/struct.js";
import { isArrayOf } from "../newtypes/array.js";
import { isEnumType } from "../newtypes/enum.js";
import {
  isCompoundConnectorInstanceType,
  isScalarConnectorInstanceType,
} from "../newtypes/connectors.js";
import { isNativeType } from "../newtypes/native.js";
import { isComponentInstanceType } from "../newtypes/component.js";
import { isAnalysisInstanceType, isStringType } from "../newtypes/index.js";

function runResolutionType(
  typename: string,
  f: (resolved: EntityType, workspace: Workspace) => Promise<void>,
  expectErrors: boolean = false
) {
  return async () => {
    const { workspace } = await loadModulesFromFS({
      sample: "CommonTests",
    });
    try {
      const degrees = definitionEntity("CommonTests", [], typename);
      const rtype = workspace.query(resolveEntityType(degrees));
      const dtype = assertHasResult(rtype);
      if (!expectErrors) {
        expect(rtype.problems()).toEqual([]);
      }
      await f(dtype, workspace);
    } finally {
      workspace.close();
    }
  };
}

describe("Test type resolutions", () => {
  test(
    "Test Real type resolution",
    runResolutionType("Degrees", async (dtype) => {
      const type = assertIs(dtype, isRealType);
      const min = assertJust(type.min);
      const max = assertJust(type.max);
      expect(min).toEqual(0);
      expect(max).toEqual(360);
    })
  );

  test(
    "Test Integer type resolution",
    runResolutionType("Trucks", async (dtype) => {
      const type = assertIs(dtype, isIntegerType);
      const quantity = assertJust(type.quantity);
      expect(quantity).toEqual("trucks");
    })
  );

  test(
    "Test Boolean type resolution",
    runResolutionType("Flag", async (dtype) => {
      expect(dtype.resolves).toEqual("Boolean");
    })
  );

  test(
    "Test String type resolution",
    runResolutionType("FileName", async (dtype) => {
      expect(dtype.resolves).toEqual("String");
    })
  );

  test(
    "Test Native type resolution",
    runResolutionType("MediumModel", async (dtype) => {
      expect(dtype.resolves).toEqual("Native");
    })
  );

  test(
    "Test function type resolution for ConversionFunction",
    runResolutionType("ConversionFunction", async (dtype) => {
      const type = assertIs(dtype, isFunctionType);
      if (type.resolves === "fun") {
        expect(type.positional.length).toEqual(1);
        expect(type.returns.length).toEqual(1);
        const pos0 = type.positional[0];
        const ret = type.returns[0];
        const pos0Type = assertIs(pos0, isRealType);
        const punits = assertJust(pos0Type.units);
        expect(punits).toEqual("degrees");
        const retType = assertIs(ret, isRealType);
        const runits = assertJust(retType.units);
        expect(runits).toEqual("rad");
      }
    })
  );

  test(
    "Test function type resolution for UnitlessConversionFunction",
    runResolutionType("UnitlessConversionFunction", async (dtype) => {
      const type = assertIs(dtype, isFunctionType);
      if (type.resolves === "fun") {
        expect(type.positional.length).toEqual(1);
        expect(type.returns.length).toEqual(1);
        const pos0 = type.positional[0];
        const ret = type.returns[0];
        assertIs(pos0, isRealType);
        assertIs(ret, isRealType);
      }
    })
  );

  test(
    "Test struct type resolutions",
    runResolutionType("InterpolationData", async (dtype) => {
      const type = assertIs(dtype, isStructType);
      if (type.resolves === "struct") {
        const time = type.fields.get("time");
        const timeArray = assertIs(time, isArrayOf);
        assertIs(timeArray.elementTypes, isRealType);
        const y = type.fields.get("y");
        const yArray = assertIs(y, isArrayOf);
        assertIs(yArray.elementTypes, isIntegerType);
      }
    })
  );

  test(
    "Test enum type resolutions",
    runResolutionType("OptionalNumber", async (dtype) => {
      const type = assertIs(dtype, isEnumType);
      const just = assertIs(type.options.get("Just"), isStructType);
      assertIs(just.fields.get("x"), isRealType);
      const nothing = assertIs(type.options.get("Nothing"), isStructType);
      expect(nothing.fields.size).toEqual(0);
    })
  );

  test(
    "Test scalar connector type resolution",
    runResolutionType("IntegerInput", async (dtype) => {
      const type = assertIs(dtype, isScalarConnectorInstanceType);
      expect(type.type.resolves).toEqual("Integer");
      expect(type.qualifier).toEqual("input");
    })
  );

  test(
    "Test compound connector type resolution",
    runResolutionType("HydraulicPort", async (dtype) => {
      const type = assertIs(dtype, isCompoundConnectorInstanceType);

      const expected = {
        p: "potential",
        m_dot: "flow",
        h: "stream",
      };

      for (const [name, qualifier] of Object.entries(expected)) {
        const field = assertIsDefined(type.fields.get(name));
        expect(isRealType(field.type)).toEqual(true);
        expect(field.qualifier).toEqual(qualifier);
      }

      const field = assertIsDefined(type.fields.get("medium"));
      expect(isNativeType(field.type)).toEqual(true);
      expect(field.qualifier).toEqual("path");
    })
  );

  test(
    "Test component type resolution",
    runResolutionType("Reservoir", async (dtype) => {
      const type = assertIs(dtype, isComponentInstanceType);
      const port = assertIsDefined(type.connectors.get("port"));
      expect(isCompoundConnectorInstanceType(port.type)).toEqual(true);
      const p0 = assertIsDefined(type.parameters.get("p0"));
      expect(isRealType(p0.type)).toEqual(true);
      expect(p0.variability).toEqual("parameter");
      expect(p0.final).toEqual(false);
      const rho0 = assertIsDefined(type.parameters.get("rho0"));
      expect(isRealType(rho0.type)).toEqual(true);
      expect(rho0.variability).toEqual("parameter");
      expect(rho0.final).toEqual(true);
      expect(type.parameters.get("rho")).not.toBeDefined();
    })
  );

  test(
    "Test component type resolution",
    runResolutionType("Reservoir0", async (dtype) => {
      const type = assertIs(dtype, isComponentInstanceType);
      const port = assertIsDefined(type.connectors.get("port"));
      expect(isCompoundConnectorInstanceType(port.type)).toEqual(true);
      const p0 = assertIsDefined(type.parameters.get("p0"));
      expect(isRealType(p0.type)).toEqual(true);
      expect(p0.variability).toEqual("parameter");
      expect(p0.final).toEqual(false);
      const rho0 = assertIsDefined(type.parameters.get("rho0"));
      expect(isRealType(rho0.type)).toEqual(true);
      expect(rho0.variability).toEqual("parameter");
      expect(rho0.final).toEqual(true);
      expect(type.parameters.get("rho")).not.toBeDefined();
    })
  );

  test(
    "Test analysis type resolution",
    runResolutionType("AutotuneAnalysis", async (dtype) => {
      const type = assertIs(dtype, isAnalysisInstanceType);
      const name = assertIsDefined(type.parameters.get("name"));
      expect(isStringType(name.type)).toEqual(true);
      expect(name.variability).toEqual("parameter");
      expect(name.final).toEqual(false);
    })
  );

  test(
    "Test analysis type resolution with problems",
    runResolutionType(
      "BogusAnalysis",
      async (dtype) => {
        const type = assertIs(dtype, isAnalysisInstanceType);
        const name = assertIsDefined(type.parameters.get("name"));
        expect(isStringType(name.type)).toEqual(true);
        expect(name.variability).toEqual("parameter");
        expect(name.final).toEqual(false);
      },
      true
    )
  );
});
