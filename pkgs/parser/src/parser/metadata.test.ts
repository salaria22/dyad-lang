import { evalJson } from "../builder/eval_metadata.js";
import { parseMetadata } from "./metadata_parser.js";

describe("Test metadata parsing and evaluation", () => {
  test("Test negative number handling", () => {
    const result = parseMetadata(`{ "x": 5, "y": -5 }`);
    expect(result.lexErrors).toHaveLength(0);
    expect(result.parseErrors).toHaveLength(0);
    const e = evalJson(result.cst);
    expect(e).toEqual({ x: 5, y: -5 });
  });
});
