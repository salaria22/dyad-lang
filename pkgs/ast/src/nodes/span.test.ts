import { sourceKey } from "./keys";
import { isTextProblem, spanError } from "./span";

describe("Test span related functions", () => {
  const fooError = spanError("foo", "Foo");
  test("Test predicates", () => {
    const x = fooError("bar", "Bar", {
      file: sourceKey("bar.dyad", []),
      span: { sl: 1, sc: 10, el: 2, ec: 5 },
    });
    expect(x.extra.file).toEqual(sourceKey("bar.dyad", []));
    expect(isTextProblem(x)).toEqual(true);
  });
});
