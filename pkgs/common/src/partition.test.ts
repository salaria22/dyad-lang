import { partition, partitionByType } from "./partition.js";

describe("Test partition function", () => {
  test("Test typesafe partitioning", () => {
    const a = [5, "x", 10, "foo"];
    const [s, n] = partitionByType(a, (x): x is string => {
      return typeof x === "string";
    });
    expect(n).toEqual([5, 10]);
    expect(s).toEqual(["x", "foo"]);
  });
  test("Test normal partitioning", () => {
    const a = [5, "x", 10, "foo"];
    const [s, n] = partition(a, (x): x is string => {
      return typeof x === "string";
    });
    expect(n).toEqual([5, 10]);
    expect(s).toEqual(["x", "foo"]);
  });
});
