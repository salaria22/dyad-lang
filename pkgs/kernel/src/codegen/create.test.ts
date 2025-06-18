import { createLibrary } from "./library/create.js";
import { TestingFS } from "../workspace/utils.test.js";
import { fileExtension, sourceFolder } from "@juliacomputing/dyad-common";

describe("Test project creation", () => {
  test("Basic project", async () => {
    const fs = new TestingFS();
    await createLibrary("Basic", fs, ".", {
      name: "Test User",
      email: "test.user@juliahub.com",
    });

    expect(fs.directories).toEqual([
      ".",
      "generated",
      "src",
      "test",
      sourceFolder,
      "assets",
      ".vscode",
    ]);
    expect([...fs.files.keys()]).toEqual([
      "assets/.gitkeep",
      ".gitignore",
      ".gitattributes",
      "README.md",
      "Project.toml",
      "src/Basic.jl",
      "test/runtests.jl",
      ".vscode/settings.json",
      `${sourceFolder}/hello.${fileExtension}`,
    ]);

    const proj = fs.files.get("Project.toml");
    expect(proj).toBeDefined();
    if (proj !== undefined) {
      const lines = proj.split("\n");
      const withoutUUID = [lines[0], ...lines.slice(2)].join("\n");
      expect(withoutUUID).toMatchSnapshot();
      expect(
        fs.files.get(`${sourceFolder}/hello.${fileExtension}`)
      ).toMatchSnapshot();
    }
  });

  test("Overload initial contents", async () => {
    const fs = new TestingFS();
    await createLibrary(
      "Basic",
      fs,
      ".",
      {
        name: "Test User",
        email: "test.user@juliahub.com",
      },
      {
        contents: {
          "foo.dyad": `type Foo = Real`,
          "bar.dyad": "type Bar = Real",
        },
      }
    );

    expect([...fs.files.keys()]).toEqual([
      "assets/.gitkeep",
      ".gitignore",
      ".gitattributes",
      "README.md",
      "Project.toml",
      "src/Basic.jl",
      "test/runtests.jl",
      ".vscode/settings.json",
      `${sourceFolder}/foo.${fileExtension}`,
      `${sourceFolder}/bar.${fileExtension}`,
    ]);

    expect(fs.files.get(`${sourceFolder}/foo.${fileExtension}`)).toEqual(
      "type Foo = Real"
    );
    expect(fs.files.get(`${sourceFolder}/bar.${fileExtension}`)).toEqual(
      "type Bar = Real"
    );
  });

  test("Overload deps", async () => {
    const fs = new TestingFS();
    await createLibrary(
      "BasicWithDev",
      fs,
      ".",
      {
        name: "Test User",
        email: "test.user@juliahub.com",
      },
      {
        deps: {
          DiffEqDevTools: {
            uuid: "f3b72e0c-5b89-59e1-b016-84e28bfd966d",
            compat: "=2.45.0",
          },
        },
      }
    );

    const proj = fs.files.get("Project.toml");
    expect(proj).toBeDefined();
    if (proj !== undefined) {
      const lines = proj.split("\n");
      const withoutUUID = [lines[0], ...lines.slice(2)].join("\n");
      expect(withoutUUID).toMatchSnapshot();
    }
  });
});
