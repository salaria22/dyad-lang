import { Range, createConnection } from "vscode-languageserver/node";
import { SharedExtensionVariables } from "../shared.js";
import { queryPredicate } from "../workspace.js";
import {
  ComponentDefinition,
  isComponentDefinition,
  isParsedFile,
} from "@juliacomputing/dyad-ast";
import {
  getDefinitionRelations,
  getFileNode,
  normalizeDefinition,
} from "@juliacomputing/dyad-kernel";
import { keyToPath } from "../context.js";
import { Nullable } from "@juliacomputing/dyad-common";
import { spanToRange } from "../range.js";
import {
  ListTestsResponseParams,
  TestableEntity,
  listTestsMethod,
} from "../../requestDefinitions/tests.js";

export function registerTestHandler(
  connection: ReturnType<typeof createConnection>,
  shared: SharedExtensionVariables
) {
  connection.onRequest(
    listTestsMethod,
    async (): Promise<ListTestsResponseParams> => {
      return shared.workspace.caseOf({
        Nothing: () => ({ tests: [] }),
        Just: (workspace) => {
          const tests: TestableEntity[] = [];
          const defs = workspace.query(queryPredicate(isComponentDefinition));
          for (const def of defs) {
            const norm = normalizeDefinition(def.metadata?.value ?? {});
            const testlist = [...Object.keys(norm.Dyad.tests)];
            if (testlist.length > 0) {
              const rels = workspace.query(getDefinitionRelations(def));
              const file = workspace.query(
                getFileNode(rels.file, isParsedFile)
              );
              file
                .chain((f) => workspace.query(keyToPath(shared, f)))
                .map(createTestableEntity(def, testlist))
                .ifResult((e) => tests.push(e), []);
            }
          }
          return { tests };
        },
      });
    }
  );
}

function createTestableEntity(def: ComponentDefinition, testlist: string[]) {
  return (path: string) => {
    const range: Nullable<Range> = def.span ? spanToRange(def.span) : null;
    const entity: TestableEntity = {
      label: def.name.value,
      path: path,
      children: testlist.map((x) => ({
        label: x,
        path: path,
        range,
      })),
      range,
    };
    return entity;
  };
}
