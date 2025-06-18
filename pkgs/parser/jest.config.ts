import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "dist"],
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
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
