import { isObject, objectAll, objectFilterMap, objectMap } from "./object.js";

describe("Test object related functionality", () => {
  test("Test isObject", () => {
    expect(isObject({})).toEqual(true);
    expect(isObject({ x: 5 })).toEqual(true);
    expect(isObject([])).toEqual(false);
    expect(isObject(null)).toEqual(false);
    expect(isObject("foo")).toEqual(false);
    expect(isObject(undefined)).toEqual(false);
  });

  test("Test objectMap and objectFilterMap", () => {
    const even = (x: number): x is number => x % 2 === 0;
    const vals = { x: 5, y: 10, z: 12 };
    const squares = objectMap(vals, (x) => x * x);
    expect(squares).toEqual({ x: 25, y: 100, z: 144 });
    const evenSquares = objectFilterMap(vals, even, (x) => x * x);
    expect(evenSquares).toEqual({ y: 100, z: 144 });
    const stringValues = objectFilterMap(vals, even, (x) => `${x}`);
    expect(stringValues).toEqual({ y: "10", z: "12" });
  });

  test("Test objectAll", () => {
    const vals = { x: 5, y: 10, z: 12 };
    expect(objectAll(vals, (x) => typeof x === "string")).toEqual(false);
    expect(objectAll(vals, (x): x is number => typeof x === "number")).toEqual(
      true
    );
  });
});
