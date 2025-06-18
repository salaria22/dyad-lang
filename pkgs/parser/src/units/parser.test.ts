import { baseUnits } from "./base";
import { checkConsistency } from "./consist";
import { derivedUnits } from "./derived";
import { divUnit, multUnit } from "./ops";
import { parseUnits, unitTokens } from "./parser";
import { unit, unitless } from "./unit";

describe("Test unit parser", () => {
  test("Correct unit tokens", () => {
    expect(unitTokens.map((x) => x[0])).toEqual([
      "rad",
      "kat",
      "mol",
      "Hz",
      "sr",
      "Pa",
      "Wb",
      "°C",
      "lm",
      "lx",
      "Bq",
      "Gy",
      "Sv",
      "kg",
      "cd",
      "N",
      "J",
      "W",
      "C",
      "V",
      "F",
      "Ω",
      "S",
      "T",
      "H",
      "s",
      "m",
      "K",
      "A",
    ]);
  });
  test("Test simple units (no operations)", () => {
    const hz = parseUnits("Hz");
    expect(checkConsistency(hz, derivedUnits.Hz)).toEqual(null);
  });
  test("Test multiplication", () => {
    const aimp = parseUnits("N.m.s");
    expect(
      checkConsistency(
        aimp,
        multUnit(multUnit(derivedUnits.N, baseUnits.s), baseUnits.s)
      )
    );
  });
  test("Test division", () => {
    const amom = parseUnits("kg.m2/s");
    expect(checkConsistency(amom, unit({ kg: 1, m: 2, s: -1 }))).toEqual(null);
  });
  test("Test parentheses", () => {
    const tcon = parseUnits("W/(m.K)");
    expect(
      checkConsistency(
        tcon,
        divUnit(derivedUnits.W, multUnit(baseUnits.m, baseUnits.K))
      )
    );
    const one = parseUnits("(m.K)/(m.K)");
    expect(checkConsistency(unitless, one)).toEqual(null);
  });
  test("Complex expressions", () => {
    const damp = parseUnits("N.s/m");
    expect(
      checkConsistency(
        damp,
        divUnit(multUnit(derivedUnits.N, baseUnits.s), baseUnits.m)
      )
    );
  });
  test("Expression comparisons", () => {
    const expectSame = (a: string, b: string) => {
      const aunit = parseUnits(a);
      const bunit = parseUnits(b);
      expect(checkConsistency(aunit, bunit)).toEqual(null);
    };

    const expectDiff = (a: string, b: string) => {
      const aunit = parseUnits(a);
      const bunit = parseUnits(b);
      expect(checkConsistency(aunit, bunit)).not.toEqual(null);
    };

    expectSame("kg.m", "m.kg");
    expectSame("(m.K)/(K.m)", "1");
    expectSame("N", "kg.m/s/s");

    expectDiff("kg", "m");
    expectDiff("kg/kg", "kg");
  });
});
