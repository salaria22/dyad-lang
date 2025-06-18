import { dyadComponent, normalizeComponent } from "./component.js";
import { checkMethod } from "./definition.test.js";

const check = checkMethod(dyadComponent.passthrough(), normalizeComponent);

describe("Test component metadata", () => {
  test("Verify schema validation", () => {
    const r1 = dyadComponent.passthrough().safeParse({});
    expect(r1.success).toEqual(true);
    const r2 = dyadComponent.passthrough().safeParse({
      Dyad: {},
    });
    expect(r2.success).toEqual(true);
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
  test("Check empty metadata", () => {
    check({}, { Dyad: {} });
    check(
      {
        CustomerX: {
          SKU: "123-456-7890",
        },

        Dyad: {},
      },
      {
        CustomerX: {
          SKU: "123-456-7890",
        },
        Dyad: {},
      }
    );
  });
  test("Check passthrough", () => {
    check({}, { Dyad: {} });
    check(
      {
        Dyad: {},
      },
      { Dyad: {} }
    );
  });
  test("Check with extra data", () => {
    check(
      {
        Dyad: {},
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
  test("Check min width and height", () => {
    check(
      {
        Dyad: {
          placement: {
            icon: { x1: 0, y1: 0, x2: 0, y2: 0 },
          },
        },
      },
      {
        Dyad: {
          placement: {
            icon: {
              iconName: "default",
              x1: 0,
              y1: 0,
              x2: 20,
              y2: 20,
              rot: 0,
            },
            diagram: {
              iconName: "default",
              x1: 0,
              y1: 0,
              x2: 20,
              y2: 20,
              rot: 0,
            },
          },
        },
      }
    );
  });
  test("Check default icon names", () => {
    check(
      {
        Dyad: {
          placement: {
            icon: { x1: 0, y1: 0, x2: 100, y2: 100 },
          },
        },
      },
      {
        Dyad: {
          placement: {
            icon: {
              iconName: "default",
              x1: 0,
              y1: 0,
              x2: 100,
              y2: 100,
              rot: 0,
            },
            diagram: {
              iconName: "default",
              x1: 0,
              y1: 0,
              x2: 100,
              y2: 100,
              rot: 0,
            },
          },
        },
      }
    );
  });
  test("Check icon placement", () => {
    check(
      {
        Dyad: {
          placement: {
            icon: { iconName: "pos", x1: 0, y1: 0, x2: 100, y2: 100 },
          },
        },
      },
      {
        Dyad: {
          placement: {
            icon: { iconName: "pos", x1: 0, y1: 0, x2: 100, y2: 100, rot: 0 },
            diagram: {
              iconName: "pos",
              x1: 0,
              y1: 0,
              x2: 100,
              y2: 100,
              rot: 0,
            },
          },
        },
      }
    );
  });
  test("Check diagram placement", () => {
    check(
      {
        Dyad: {
          placement: {
            icon: { iconName: "pos", x1: 0, y1: 0, x2: 100, y2: 100, rot: 90 },
            diagram: {
              iconName: "pos",
              x1: 100,
              y1: 100,
              x2: 200,
              y2: 200,
            },
          },
        },
      },
      {
        Dyad: {
          placement: {
            icon: { iconName: "pos", x1: 0, y1: 0, x2: 100, y2: 100, rot: 90 },
            diagram: {
              iconName: "pos",
              x1: 100,
              y1: 100,
              x2: 200,
              y2: 200,
              rot: 0,
            },
          },
        },
      }
    );
  });
});
