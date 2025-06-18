import { filterEntries, filterRecord } from "./entries.js";

describe("Test filtering of records", () => {
  const isNumber = (x: any): x is number => {
    return typeof x === "number";
  };
  const input: Record<string, number | string> = {
    a: "a",
    two: 2,
    b: "b",
    five: 5,
  };
  test("Test entries", () => {
    const numberEntries = filterEntries(input, isNumber);
    expect(numberEntries).toEqual([
      ["two", 2],
      ["five", 5],
    ]);
  });
  test("Test records", () => {
    const numberRecord = filterRecord(input, isNumber);
    expect(numberRecord).toEqual({
      two: 2,
      five: 5,
    });
  });
});
