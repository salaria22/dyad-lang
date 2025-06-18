import { dyadConnection, normalizeConnection } from "./connection.js";
import { checkMethod } from "./definition.test.js";

const check = checkMethod(dyadConnection.passthrough(), normalizeConnection);

describe("Test component metadata", () => {
  test("Verify schema validation", () => {
    const r1 = dyadConnection.passthrough().safeParse({});
    expect(r1.success).toEqual(true);
    const r2 = dyadConnection.passthrough().safeParse({
      Dyad: {},
    });
    const problems = r2.success ? [] : r2.error;
    expect(problems).toEqual([]);
  });
  test("Check missing metadata", () => {
    check({}, { Dyad: {} });
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
  test("Check valid routes", () => {
    check(
      {
        Dyad: {
          edges: [
            { S: -1, M: [{ x: 100, y: 200 }], E: 1 },
            {
              S: 1,
              M: [
                { x: 200, y: 500 },
                { x: 700, y: 1000 },
              ],
              E: -1,
            },
          ],
          junctions: [{ x: 500, y: 500 }],
        },
        CustomerX: {
          SKU: "123-456-7890",
        },
      },
      {
        Dyad: {
          edges: [
            { S: -1, M: [{ x: 100, y: 200 }], E: 1 },
            {
              S: 1,
              M: [
                { x: 200, y: 500 },
                { x: 700, y: 1000 },
              ],
              E: -1,
            },
          ],
          junctions: [{ x: 500, y: 500 }],
        },
        CustomerX: {
          SKU: "123-456-7890",
        },
      }
    );
  });
  test("Check default midpoints", () => {
    check(
      {
        Dyad: {
          edges: [
            { S: -1, E: 1 },
            {
              S: 1,
              M: [
                { x: 200, y: 500 },
                { x: 700, y: 1000 },
              ],
              E: -1,
            },
          ],
          junctions: [{ x: 500, y: 500 }],
        },
        CustomerX: {
          SKU: "123-456-7890",
        },
      },
      {
        Dyad: {
          edges: [
            { S: -1, M: [], E: 1 },
            {
              S: 1,
              M: [
                { x: 200, y: 500 },
                { x: 700, y: 1000 },
              ],
              E: -1,
            },
          ],
          junctions: [{ x: 500, y: 500 }],
        },
        CustomerX: {
          SKU: "123-456-7890",
        },
      }
    );
  });
  test("Check invalid routes", () => {
    check(
      {
        Dyad: {
          edges: [
            { S: -1 }, // no "E"
            {
              S: 1,
              M: [
                { x: 200, y: 500 },
                { x: 700, y: 1000 },
              ],
              E: -1,
            },
          ],
          junctions: [{ x: 500, y: 500 }],
        },
      },
      undefined
    );

    check(
      {
        Dyad: {
          edges: [
            { S: -1, M: { x: 100, y: 200 }, E: 1 }, // Forget array
            {
              S: 1,
              M: [
                { x: 200, y: 500 },
                { x: 700, y: 1000 },
              ],
              E: -1,
            },
          ],
          junctions: [{ x: 500, y: 500 }],
        },
      },
      undefined
    );
  });
});
