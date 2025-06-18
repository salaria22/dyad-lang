import { templates } from "./precompiled.js";

describe("Test precompiled template rendering", () => {
  test("Test component templates", () => {
    const foo = templates.component({});
    expect(foo).not.toEqual("");
  });
  test("Test precompiled sample template", () => {
    const data = {
      name: "Alan",
      hometown: "Somewhere, TX",
      kids: [
        { name: "Jimmy", age: "12" },
        { name: "Sally", age: "4" },
      ],
    };
    const result = templates.test1(data);
    expect(result).toEqual(
      `<p>Hello, my name is Alan. I am from Somewhere, TX. I have 2 kids:</p><ul><li>Jimmy is 12</li><li>Sally is 4</li></ul>`
    );
  });
});
