import { experimentsSchema, normalizeExperiments } from "./experiments.js";
import { checkMethod } from "./definition.test.js";

const check = checkMethod(experimentsSchema, normalizeExperiments);

describe("Test experiment metadata", () => {
  test("Check empty metadata", () => {
    check({}, {});
  });
  test("Check no start", () => {
    check(
      { simple: { stop: 1.0, params: {} } },
      { simple: { start: 0, stop: 1.0, params: {}, initial: {} } }
    );
  });
  test("Check no params", () => {
    check(
      { simple: { start: 1, stop: 1.0 } },
      { simple: { start: 1, stop: 1.0, params: {}, initial: {} } }
    );
  });
  test("Check no start or params", () => {
    check(
      { simple: { stop: 1.0 } },
      { simple: { start: 0, stop: 1.0, params: {}, initial: {} } }
    );
  });
  test("Check initial conditions", () => {
    check(
      { simple: { stop: 1.0, initial: { "capacitor.v": 0 } } },
      {
        simple: {
          start: 0,
          stop: 1.0,
          params: {},
          initial: { "capacitor.v": 0 },
        },
      }
    );
  });
  test("Check missing stop", () => {
    check({ simple: { params: {} } }, undefined);
  });
});
