import { isObject } from "./object.js";
import {
  isProblemWith,
  problemInfo,
  problemMessage,
  uniqueProblems,
} from "./problem.js";

interface SampleExtra {
  x: string;
  y: number;
}

function isSample(x: any): x is SampleExtra {
  if (isObject(x)) {
    return typeof x["x"] === "string" && typeof x["y"] === "number";
  }
  return false;
}

describe("Test problem functionality", () => {
  test("Test problem message without extra fields", () => {
    const prob = problemInfo<{}>("foo", "Foo")("bar", "Bar isn't defined", {
      x: 5,
      y: "hello",
    });
    expect(problemMessage(prob)).toEqual(
      "Foo: Bar isn't defined [x=5, y=hello]"
    );
  });
  test("Test for uniqueness", () => {
    const fooType = problemInfo("foo", "Foo");
    const barType = problemInfo("bar", "Bar");
    const f1 = fooType("i1", "Instance 1");
    const f1a = fooType("i1", "Instance 1");
    const f2 = fooType("i1", "Instance 2");
    const f3 = fooType("i2", "Instance 2");
    const b1 = barType("i1", "Instance 1");
    const b1a = barType("i1", "Instance 1");
    const b2 = barType("i2", "Instance 2");
    const b2a = barType("i2", "Instance 2");

    const l = uniqueProblems([f1, f1a, f2, f3, b1, b1a, b2, b2a]);
    expect(l).toEqual([f1, f2, f3, b1, b2]);
  });
  test("Test predicates", () => {
    expect(isSample(undefined)).toEqual(false);
    expect(isSample(null)).toEqual(false);
    const x = problemInfo<SampleExtra>("foo", "Foo")("abc", "a problem", {
      x: "hello",
      y: 5,
    });
    expect(isProblemWith(x, isSample)).toEqual(true);
  });
});
