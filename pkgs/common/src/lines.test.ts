import { Lines } from "./lines.js";

const sample = `component Foo
  x::Real
  y::Real
relation
  switch init
    case X(a)
    end
  end
end`;
describe("Test Lines class", () => {
  test("Basic operations", () => {
    const lines = new Lines(">>>");
    lines.add("A");
    lines.add("B", "C");
    lines.add(...["CDE", "FGH"]);
    const result = lines.toString();
    expect(result).toEqual(">>>A\n>>>B\n>>>C\n>>>CDE\n>>>FGH");
  });
  test("Test nested indenting", () => {
    const lines1 = new Lines("");
    const lines2 = new Lines("  ");
    const lines3 = new Lines("  ");
    const lines4 = new Lines("  ");
    lines1.add("component Foo");
    lines2.add("x::Real");
    lines2.add("y::Real");
    lines1.add(lines2.toString());
    lines1.add("relation");
    lines3.add("switch init");
    lines4.add("case X(a)");
    lines4.add("end");
    expect(lines4.toString()).toEqual("  case X(a)\n  end");
    lines3.add(lines4.toString());
    lines3.add("end");
    lines1.add(lines3.toString());
    lines1.add("end");
    expect(lines1.toString()).toEqual(sample);
  });
});
