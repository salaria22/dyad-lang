import { InMemoryFileSystem } from "./memfs.js";

describe("Test memory file system", () => {
  test("Test file storage and recovery", async () => {
    const fs = new InMemoryFileSystem();
    await fs.writeFile("foo", "bar");
    const contents = await fs.readFile("foo");
    expect(contents).toEqual("bar");
  });
  test("Test readdir and rmdir", async () => {
    const fs = new InMemoryFileSystem();
    await fs.writeFile("foo", "bar");
    expect(() => fs.writeFile("foo/a", "bar")).rejects;
    await fs.writeFile("d1/d2/a", "bar");
    await fs.writeFile("d1/b", "bar");
    expect(await fs.exists("d1", { type: "directory" })).toEqual(true);
    let files1 = await fs.readdir("d1");
    expect(files1).toEqual(["b"]);
    let files2 = await fs.readdir("d1/d2");
    expect(files2).toEqual(["a"]);
    await fs.rmdir("d1");
    files1 = await fs.readdir("d1");
    expect(files1).toEqual([]);
    files2 = await fs.readdir("d1/d2");
    expect(files2).toEqual([]);
  });
  test("Test unlink", async () => {
    const fs = new InMemoryFileSystem();
    await fs.writeFile("foo", "bar");
    let files = await fs.readdir("");
    expect(files).toEqual(["foo"]);
    await fs.unlink("foo");
    files = await fs.readdir("");
    expect(files).toEqual([]);
  });
  test("Test rename and stat", async () => {
    const fs = new InMemoryFileSystem();
    await fs.writeFile("foo", "bar");
    expect(await fs.exists("foo", { type: "file" })).toEqual(true);
    await fs.rename("foo", "bar");
    expect(await fs.exists("bar", { type: "file" })).toEqual(true);
    expect(await fs.exists("foo")).toEqual(false);
  });
});
