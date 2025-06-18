import { dyadDeclaration, normalizeDeclaration } from "./declaration.js";
import { checkMethod } from "./definition.test.js";

const check = checkMethod(dyadDeclaration.passthrough(), normalizeDeclaration);

describe("Test declaration metadata", () => {
  test("Check empty metadata", () => {
    check({}, { Dyad: {} });
  });
  test("Check passthrough", () => {
    check(
      {
        CustomerX: {
          SKU: "123-456-7890",
        },
      },
      {
        CustomerX: {
          SKU: "123-456-7890",
        },
        Dyad: {},
      }
    );
  });
});
