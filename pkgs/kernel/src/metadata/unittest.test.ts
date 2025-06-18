import { unitTestsSchema, normalizeUnitTests } from "./unittest.js";
import { checkMethod } from "./definition.test.js";

const check = checkMethod(unitTestsSchema, normalizeUnitTests);

describe("Test unittest metadata", () => {
  test("Check empty metadata", () => {
    check({}, {});
  });
  test("Check with and without initial and final", () => {
    check(
      {
        initial_case: {
          stop: 1.0,
          params: {},
          atol: { x: 1e-7 },
          expect: {
            initial: { x: 0 },
            signals: [],
          },
        },
        final_case: {
          stop: 2.0,
          params: {},
          expect: { signals: [], final: { y: true } },
        },
      },
      {
        initial_case: {
          solver: "DefaultODEAlgorithm",
          start: 0,
          stop: 1.0,
          params: {},
          initial: {},
          atol: { x: 1e-7 },
          expect: {
            initial: { x: 0 },
            signals: [],
            final: {},
          },
        },
        final_case: {
          solver: "DefaultODEAlgorithm",
          start: 0,
          stop: 2.0,
          params: {},
          initial: {},
          atol: {},
          expect: {
            initial: {},
            final: { y: true },
            signals: [],
          },
        },
      }
    );
  });
  test("Check no start", () => {
    check(
      { simple: { stop: 1.0, params: {}, expect: { signals: [] } } },
      {
        simple: {
          solver: "DefaultODEAlgorithm",
          start: 0,
          stop: 1.0,
          params: {},
          initial: {},
          atol: {},
          expect: {
            initial: {},
            final: {},
            signals: [],
          },
        },
      }
    );
  });
  test("Check no params", () => {
    check(
      { simple: { start: 1, stop: 1.0, signals: [] } },
      {
        simple: {
          solver: "DefaultODEAlgorithm",
          start: 1,
          stop: 1.0,
          params: {},
          initial: {},
          atol: {},
          expect: {
            initial: {},
            final: {},
            signals: [],
          },
        },
      }
    );
  });
  test("Check no start or params", () => {
    check(
      { simple: { stop: 1.0, expect: { signals: [] } } },
      {
        simple: {
          solver: "DefaultODEAlgorithm",
          start: 0,
          stop: 1.0,
          params: {},
          initial: {},
          atol: {},
          expect: {
            initial: {},
            final: {},
            signals: [],
          },
        },
      }
    );
  });
  test("Check missing stop", () => {
    check({ simple: { params: {} } }, undefined);
  });
});
