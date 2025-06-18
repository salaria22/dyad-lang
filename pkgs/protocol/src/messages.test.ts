import { isSelection, selectionNotification } from "./messages.js";

describe("Test Messages", () => {
  test("Test selection notification", () => {
    const sel = selectionNotification("/foo/bar");
    expect(sel.kind).toEqual("selection");
    expect(isSelection(sel)).toEqual(true);
  });
});
