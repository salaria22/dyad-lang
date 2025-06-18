import { defaultIcons } from "./default_icons.js";
import {
  defaultLabels,
  dyadDefinition,
  normalizeDefinition,
} from "./definition.js";
import { z } from "zod";

export function checkMethod(schema: z.Schema, normalize: (x: any) => any) {
  return (v: any, expected: any) => {
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      if (expected !== undefined) {
        for (const err of parsed.error.issues) {
          console.error(`Parsing error: `, err);
        }
        expect(parsed.error.issues).toEqual([]);
      }
    } else {
      const norm = normalize(parsed.data);
      expect(norm).toEqual(expected);
    }
  };
}

const check = checkMethod(dyadDefinition.passthrough(), normalizeDefinition);

describe("Test definition metadata", () => {
  test("Check empty metadata", () => {
    check(
      {},
      {
        Dyad: {
          experiments: {},
          path: {},
          doc: { behavior: true },
          labels: defaultLabels,
          tests: {},
          icons: defaultIcons,
        },
      }
    );
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
        Dyad: {
          experiments: {},
          path: {},
          doc: { behavior: true },
          labels: defaultLabels,
          tests: {},
          icons: defaultIcons,
        },
      }
    );
  });
  test("Check custom icons", () => {
    check(
      { Dyad: { icons: { pos: "dyad://Library/asset.svg" } } },
      {
        Dyad: {
          experiments: {},
          path: {},
          doc: { behavior: true },
          labels: defaultLabels,
          tests: {},
          icons: { pos: "dyad://Library/asset.svg" },
        },
      }
    );
  });
  test("Check non-URI icon", () => {
    check({ Dyad: { icons: { pos: "./asset.svg" } } }, undefined);
  });
  test("Check experiment normalization", () => {
    check(
      { Dyad: { experiments: { simple: { stop: 1 } } } },
      {
        Dyad: {
          experiments: {
            simple: {
              start: 0,
              stop: 1,
              params: {},
              initial: {},
            },
          },
          path: {},
          doc: { behavior: true },
          labels: defaultLabels,
          tests: {},
          icons: defaultIcons,
        },
      }
    );
  });
  test("check label normalization", () => {
    check(
      {
        Dyad: {
          labels: [
            {
              label: "foo",
              x: 0,
              y: 0,
              rot: 0,
              layer: "icon",
              attrs: {},
            },
            {
              label: "bar",
              x: 0,
              y: 0,
            },
            {
              label: "fuz",
              x: 0,
              y: 0,
              rot: 90,
              layer: "all",
              attrs: { fill: "red" },
            },
          ],
        },
      },
      {
        Dyad: {
          experiments: {},
          path: {},
          doc: { behavior: true },
          tests: {},
          icons: defaultIcons,
          labels: [
            {
              label: "foo",
              x: 0,
              y: 0,
              rot: 0,
              layer: "icon",
              attrs: {},
            },
            {
              label: "bar",
              x: 0,
              y: 0,
              rot: 0,
              layer: "icon",
              attrs: {},
            },
            {
              label: "fuz",
              x: 0,
              y: 0,
              rot: 90,
              layer: "all",
              attrs: { fill: "red" },
            },
          ],
        },
      }
    );
  });
  test("Check test normalization", () => {
    check(
      { Dyad: { tests: { simple: { stop: 1, expect: { signals: [] } } } } },
      {
        Dyad: {
          experiments: {},
          path: {},
          doc: { behavior: true },
          labels: defaultLabels,
          tests: {
            simple: {
              solver: "DefaultODEAlgorithm",
              start: 0,
              stop: 1,
              params: {},
              initial: {},
              atol: {},
              expect: {
                initial: {},
                final: {},
                signals: [],
              },
            },
          },
          icons: defaultIcons,
        },
      }
    );
  });
});
