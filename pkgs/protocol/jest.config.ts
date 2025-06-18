import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/.yalc/", "/dist/", "/cjs/"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@juliacomputing/dyad-common/(.*)$": "<rootDir>/../common/src/$1",
    "^@juliacomputing/dyad-ast/(.*)$": "<rootDir>/../ast/src/$1",
    "^@juliacomputing/dyad-parser/(.*)$": "<rootDir>/../parser/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: ["!node_modules/", "!.yalc/"],
};

export default config;
