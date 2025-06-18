import { rlc_sources } from "./samples/rlc.js";
import { queryType } from "../workspace/index.js";
import { isComponentDefinition } from "@juliacomputing/dyad-ast";
import { loadWorkspace, loadWorkspaceToZip } from "./testing.js";
import { generateSchema, generateZod } from "./schemas.js";
import { zodIssue2Problem } from "../metadata/issues.js";
import { SafeParseReturnType } from "zod";
import { assertHasResult, assertJust } from "../workspace/utils.test.js";

const schema_sources = {
  "complex.dyad": `type Pressure = Real
type Resistance = Real(min=0)
component Complex
  parameter v::Real(min=0)
  parameter p::Pressure = 101326
  parameter sw::Boolean
  parameter dataFile::String
  # Number of elements to create (this should end up in the schema description)
  parameter n::Integer(min=1,max=5)
  parameter R::Resistance
end`,
};

describe("Test Schema generation", () => {
  test("Test schema generation for resistor model", async () => {
    /* Create a workspace with a single library */
    const { workspace } = await loadWorkspace("RLC", rlc_sources);

    const def = workspace.query(queryType("RLC", [], "Resistor"));
    expect(def.isJust()).toEqual(true);
    const definition = def.unsafeCoerce();
    expect(isComponentDefinition(definition)).toEqual(true);
    if (isComponentDefinition(definition)) {
      const zod = assertHasResult(
        generateZod(definition, workspace.query.bind(workspace))
      );
      const v1 = zod.safeParse({ R: 10 });
      expect(v1.success).toEqual(true);
      const v2 = zod.safeParse({});
      expect(v2.success).toEqual(false);
      const v3 = zod.safeParse({ R: 10, T: 20 });
      expect(v3.success).toEqual(true);

      const schema = assertHasResult(
        generateSchema(definition, workspace.query.bind(workspace))
      );
      expect(schema).toMatchSnapshot();
    }
  });
  test("Test schema generation for complex model", async () => {
    /* Create a workspace with a single library */
    const { workspace, issues } = await loadWorkspaceToZip(
      "Schemas",
      schema_sources
    );

    expect(issues).toEqual([]);
    const def = assertJust(
      workspace.query(queryType("Schemas", [], "Complex"))
    );
    expect(isComponentDefinition(def)).toEqual(true);
    if (isComponentDefinition(def)) {
      const v1IssueMap = zodIssue2Problem("v1", "generated");
      const base = {
        v: 0,
        p: 101325,
        sw: true,
        dataFile: "foo.txt",
        n: 3,
        R: 100,
      };
      const checkIssues = (v: SafeParseReturnType<any, any>) => {
        if (!v.success) {
          expect(
            v.error.issues.map((x) => v1IssueMap(x, { file: null, span: null }))
          ).toEqual([]);
        }
        expect(v.success).toEqual(true);
      };
      const zod = assertHasResult(
        generateZod(def, workspace.query.bind(workspace))
      );
      const v1 = zod.safeParse(base);
      checkIssues(v1);
      const v2 = zod.safeParse({});
      expect(v2.success).toEqual(false);
      const v3 = zod.safeParse({ ...base, v: -1 });
      expect(v3.success).toEqual(false);
      const v4 = zod.safeParse({ ...base, n: 6 });
      expect(v4.success).toEqual(false);
      const v5 = zod.safeParse({ ...base, n: 6.5 });
      expect(v5.success).toEqual(false);
      const v6 = zod.safeParse({ ...base, R: -100 });
      expect(v6.success).toEqual(false);

      const schema = assertHasResult(
        generateSchema(def, workspace.query.bind(workspace))
      );
      expect(schema).toMatchSnapshot();
    }
  });
});
