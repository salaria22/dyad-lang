import { baseUnits } from "./base";
import { checkConsistency } from "./consist";
import { derivedUnits } from "./derived";
import { divUnit, multUnit } from "./ops";
import { stringifyUnit, Unit, unitless } from "./unit";

describe("Test derived unit equivalence", () => {
  const shouldMatch = (a: Unit, b: Unit) =>
    expect(checkConsistency(a, b)).toBeNull();
  test("Test identity", () => {
    shouldMatch(unitless, unitless);
    shouldMatch(baseUnits.K, baseUnits.K);
  });
  test("Test division", () => {
    shouldMatch(
      derivedUnits["N"],
      divUnit(
        divUnit(multUnit(baseUnits.m, baseUnits.kg), baseUnits.s),
        baseUnits.s
      )
    );
  });
  test("Test stringification", () => {
    expect(stringifyUnit(derivedUnits.Pa)).toEqual("kg.m-1.s-2");
  });
});
