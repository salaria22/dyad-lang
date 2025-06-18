// Tests for resolveProjectFile utility in workspace.ts
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { resolveProjectFile } from "./workspace.js";

describe("resolveProjectFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dyad-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("resolves a directory containing Project.toml", () => {
    const dir = path.join(tmpDir, "projdir");
    fs.mkdirSync(dir);
    const projFile = path.join(dir, "Project.toml");
    fs.writeFileSync(projFile, "[deps]\n");
    expect(resolveProjectFile(dir)).toBe(projFile);
  });

  it("resolves a direct Project.toml file path", () => {
    const projFile = path.join(tmpDir, "Project.toml");
    fs.writeFileSync(projFile, "[deps]\n");
    expect(resolveProjectFile(projFile)).toBe(projFile);
  });

  it("resolves a Julia shared environment (starts with @)", () => {
    const envName = "MyEnv";
    const envDir = path.join(os.homedir(), ".julia", "environments", envName);
    fs.mkdirSync(envDir, { recursive: true });
    const projFile = path.join(envDir, "Project.toml");
    fs.writeFileSync(projFile, "[deps]\n");
    expect(resolveProjectFile("@" + envName)).toBe(projFile);
  });

  it("throws for invalid project argument", () => {
    expect(() => resolveProjectFile("not-a-real-path")).toThrow();
  });
}); 