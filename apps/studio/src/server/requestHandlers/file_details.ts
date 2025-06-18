import { createConnection } from "vscode-languageserver/node";
import { SharedExtensionVariables } from "../shared.js";
import {
  FileDetails,
  fileDetailsMethod,
  FileDetailsRequestParams,
  FileDetailsResponseParams,
  Outline,
} from "../../requestDefinitions/file_detail.js";
import { getContext } from "../context.js";
import {
  ComponentDefinition,
  isComponentDefinition,
  isParsedFile,
} from "@juliacomputing/dyad-ast";
import {
  generateDiagram,
  instantiateModel,
  Workspace,
  flattenDefinitionEntity,
  definitionEntity,
  stringifyProblem,
} from "@juliacomputing/dyad-kernel";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import debug from "debug";

const requestLog = debug("requests:details");

export function registerFileDetailsHandler(
  connection: ReturnType<typeof createConnection>,
  shared: SharedExtensionVariables
) {
  connection.onRequest(
    fileDetailsMethod,
    async (
      params: FileDetailsRequestParams
    ): Promise<FileDetailsResponseParams> => {
      requestLog("Got request for file details");
      return shared.workspace.caseOf({
        Nothing: () => {
          throw new Error("Unable to find shared workspace");
        },
        Just: async (workspace) => {
          requestLog("Requested file details for %s", params.uri);
          const details: FileDetails = {
            uri: params.uri,
            filename: "",
            diagrams: [],
            outlines: [],
            flattens: [],
            testableEntities: [],
          };

          // Collect information about this file
          await getContext(params.uri, shared).caseOf({
            Nothing: () => Promise.resolve(undefined),
            Just: async (c) => {
              details.filename = c.filename;
              // Is this file parseable?
              if (isParsedFile(c.contents)) {
                requestLog(
                  `Extracting file details for %s`,
                  c.contents.source.file
                );
                // Iterate over the definitions found in the file...
                for (const def of c.contents.definitions) {
                  if (isComponentDefinition(def)) {
                    await addFlatten(def, workspace, c.libraryName, details);
                    await addDiagram(def, workspace, details);
                    await addOutline(def, workspace, details);
                  }
                }
              }
            },
          });

          return details;
        },
      });
    }
  );
}

async function addFlatten(
  def: ComponentDefinition,
  workspace: Workspace,
  libraryName: string,
  details: FileDetails
) {
  try {
    const span = def.span;
    if (span !== null && isComponentDefinition(def)) {
      const entity = definitionEntity(libraryName, [], def.name.value);
      const flattened = workspace.query(
        flattenDefinitionEntity(entity, new Set())
      );
      const text = flattened.map(unparseDyad);
      const problems = text.problems();

      let flatText = "";
      for (const problem of problems) {
        flatText += stringifyProblem(problem);
        flatText += "\n";
      }
      if (text.hasValue()) {
        flatText += text.value;
      }

      details.flattens.push({
        component: flatText,
        span,
        tooltip: `Flattened view of ${def.name.value} component`,
      });
    }
  } catch (e) {
    console.error(`While flattening ${def.name.value}, got error: `, e);
    throw e;
  }
}

async function addDiagram(
  def: ComponentDefinition,
  workspace: Workspace,
  details: FileDetails
) {
  const query = workspace.query.bind(workspace);
  const span = def.span;
  // If they have a span (and, generally, they should)
  if (span !== null) {
    requestLog("Extracting span related information for %s", def.name.value);
    // Check if it is a component definition
    if (isComponentDefinition(def)) {
      const inst = instantiateModel(def, {}, null, query);
      // If it is a component AND we can successfully render the diagram for it
      // add that to the information we are collecting about this file.
      await inst.ifAsyncResult(async (instance) => {
        const svg = await generateDiagram("", instance, query);
        if (svg.hasValue()) {
          details.diagrams.push({
            svg: svg.value,
            span,
            tooltip: `Diagram of ${def.name.value} component`,
          });
        }
      }, []);
    }
  }
}

async function addOutline(
  def: ComponentDefinition,
  workspace: Workspace,
  details: FileDetails
) {
  const span = def.span;
  // If they have a span (and, generally, they should)
  if (span !== null) {
    requestLog("Extracting span related information for %s", def.name.value);
    // Check if it is a component definition
    if (isComponentDefinition(def)) {
      const outline: Outline = {
        span: span,
        tooltip: `UML Diagram for ${def.name.value}`,
        outline: {
          typename: def.name.value,
          extends: [],
          instances: {},
        },
      };
      details.outlines.push(outline);
    }
  }
}
