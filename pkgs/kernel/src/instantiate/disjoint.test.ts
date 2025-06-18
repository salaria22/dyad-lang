import { DisjointSets } from "./disjoint.js";

describe("Test disjoint sets", () => {
  test("Test adding without joins", () => {
    const ds = new DisjointSets<string>();
    expect(ds.size()).toEqual(0);
    expect(ds.has("foo")).toEqual(false);
    ds.add("foo");
    expect(ds.has("foo")).toEqual(true);
    expect(ds.has("bar")).toEqual(false);
    expect(ds.size()).toEqual(1);
    ds.add("bar");
    expect(ds.has("bar")).toEqual(true);
    expect(ds.size()).toEqual(2);
    expect(() => ds.add("bar")).toThrow();
  });
  test("Test joins", () => {
    const ds = new DisjointSets(["foo", "bar", "buz"]);
    expect(ds.size()).toEqual(3);
    ds.join("foo", "bar");
    expect(ds.size()).toEqual(2);
    const ifoo = ds.belongsTo("foo");
    const ibar = ds.belongsTo("bar");
    const ibuz = ds.belongsTo("buz");
    expect(ifoo).toEqual(ibar);
    expect(ifoo).not.toEqual(ibuz);
    expect(ds.getSet(ifoo)).toContain("foo");
    expect(ds.getSet(ifoo)).toContain("bar");
    expect(ds.getSet(ifoo)).not.toContain("buz");
    expect(ds.getSet(ibar)).toContain("foo");
    expect(ds.getSet(ibar)).toContain("bar");
    expect(ds.getSet(ibar)).not.toContain("buz");
    expect(ds.getSet(ibuz)).not.toContain("foo");
    expect(ds.getSet(ibuz)).not.toContain("bar");
    expect(ds.getSet(ibuz)).toContain("buz");
  });
  test("Test multijoin", () => {
    const ds = new DisjointSets(["foo", "bar", "buz", "hello", "world"]);
    expect(ds.getSets()).toEqual([
      ["foo"],
      ["bar"],
      ["buz"],
      ["hello"],
      ["world"],
    ]);
    ds.multiJoin("foo", "bar", "buz");
    expect(ds.getSets()).toEqual([["foo", "bar", "buz"], ["hello"], ["world"]]);
  });
  test("Test different comparator", () => {
    const ds = new DisjointSets(
      ["Foo", "BAR", "buz", "hello", "World"],
      (x, y) => x.toLowerCase() === y.toLowerCase()
    );
    expect(ds.getSets()).toEqual([
      ["Foo"],
      ["BAR"],
      ["buz"],
      ["hello"],
      ["World"],
    ]);
    ds.multiJoin("foo", "bar", "buz");
    expect(ds.getSets()).toEqual([["Foo", "BAR", "buz"], ["hello"], ["World"]]);
  });
});
