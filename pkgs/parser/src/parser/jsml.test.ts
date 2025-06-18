import { execSync } from "child_process";

import fs from "fs";
import path from "path";
import debug from "debug";
import { AstBuilder } from "../builder/ast_builder.js";
import { FileCstNode } from "./dyad_cst.js";
import { sourceKey } from "@juliacomputing/dyad-ast";
import { unparseDyad, parseDyad } from "./index.js";
import { fileExtension } from "@juliacomputing/dyad-common";

const cstLog = debug("parse:cst");
const tokenLog = debug("parse:tokens");

describe("Test Dyad Parser", () => {
  test("Parse analyses", () => {
    runTest("analyses");
  });
  test("Parse arrays", () => {
    runTest("arrays");
  });
  test("Parse basic connector", () => {
    runTest("basicConn");
  });
  test("Parse conditional", () => {
    runTest("conditional");
  });
  test("Parse expressions", () => {
    runTest("expressions");
  });
  test.skip("Parse state diagram", () => {
    runTest("machine1");
  });
  test("Parse models", () => {
    runTest("models");
  });
  test("Parse orifice component", () => {
    runTest("orifice");
  });
  test.skip("Parse started", () => {
    runTest("started");
  });
  test("Parse systems", () => {
    runTest("systems");
  });
  test.skip("Parse traffic lights", () => {
    runTest("traffic_lights");
  });
  test("Parse type definitions", () => {
    runTest("typedef");
  });
  test("Parse Unicode", () => {
    runTest("unicode");
  });
  test("Parse using statements", () => {
    runTest("using");
  });
});

function runTest(name: string) {
  const orig = loadSample(name);
  const cst = parseDyad(orig, name, null);
  const file = checkCST(name, cst);
  expect(file).toMatchSnapshot();
  const recon = unparseDyad(file);
  expect(recon).toEqual(orig);
  const semantic = unparseDyad(file, "", { semanticOnly: true });
  expect(semantic).toMatchSnapshot();
}

function checkCST(name: string, parseResults: ReturnType<typeof parseDyad>) {
  for (const token of parseResults.tokens) {
    tokenLog("[%s]: '%s'", token.tokenType.name, token.image);
  }
  cstLog("CST: %j", parseResults.cst);
  for (const err of parseResults.lexErrors) {
    expect(err.details).toEqual("");
  }
  expect(parseResults.lexErrors).toHaveLength(0);
  for (const err of parseResults.parseErrors) {
    expect(err.details).toEqual("");
  }
  expect(parseResults.parseErrors).toHaveLength(0);

  const builder = new AstBuilder();

  const file: FileCstNode = parseResults.cst as any;
  const children = file.children;
  return builder.file(children, { provider: "foo", file: sourceKey(name, []) });
}

function loadSample(name: string): string {
  const data = fs.readFileSync(
    path.join(
      root(),
      "pkgs",
      "parser",
      "samples",
      "parser_tests",
      `${name}.${fileExtension}`
    )
  );
  return data.toString();
}

/**
 * This function finds the root of the git repository (assuming you are in a directory of a git repository)
 * using the **synchronous** function `execSync`.
 * @returns The path to the root of the git repository
 */
export function root(): string {
  return execSync("git rev-parse --show-toplevel").toString().trim();
}
