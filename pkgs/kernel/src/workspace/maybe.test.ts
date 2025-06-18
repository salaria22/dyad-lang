import { Just, Nothing } from "purify-ts";
import { castOrThrow } from "../flow.js";
import { assertJust, assertNothing } from "./utils.test.js";
import { combineMaybe } from "./utils.js";

describe("Test utilities", () => {
  const justFive = Just(5);
  test("Test casting", () => {
    const five = castOrThrow(justFive, new Error("This should not happen"));
    expect(five).toEqual(5);
    expect(() => castOrThrow(Nothing, new Error("Should happen"))).toThrow();
  });
  test("Test assertions", () => {
    const five = assertJust(justFive);
    expect(five).toEqual(5);
    assertNothing(Nothing);
  });
  test("Test combineMaybe", () => {
    const orig = {
      x: Just(5),
      y: Just(10),
      z: Just("hello"),
    };
    const ret = combineMaybe(orig);
    expect(ret.isJust());
    const v = ret.unsafeCoerce();
    expect(v.x).toEqual(5);
    expect(v.y).toEqual(10);
    expect(v.z).toEqual("hello");
  });
});
