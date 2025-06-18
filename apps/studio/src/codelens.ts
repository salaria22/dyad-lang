import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { RequestType } from "vscode-languageclient/node";
import {
  fileDetailsMethod,
  FileDetailsRequestParams,
  FileDetailsResponseParams,
} from "./requestDefinitions/file_detail.js";
import { showFlattenedComponentCommand } from "./commands/showFlattenedComponent.js";
import { detailsCommand } from "./panels/details.js";
import type {
  DiagramMessage,
  SourceMessage,
} from "@juliacomputing/dyad-protocol";
import { TextualSpan } from "@juliacomputing/dyad-ast";

const fileDetailsType = new RequestType<
  FileDetailsRequestParams,
  FileDetailsResponseParams,
  void
>(fileDetailsMethod);

export class DyadCodeLensProvider implements vscode.CodeLensProvider {
  constructor(
    protected client: LanguageClient,
    protected context: vscode.ExtensionContext
  ) {}
  public async provideCodeLenses(document: vscode.TextDocument) {
    const ret: vscode.CodeLens[] = [];

    // TODO: there should be some clever cacheing here somewhere, perhaps a LRU
    // cache on URI
    const details = await this.client.sendRequest(fileDetailsType, {
      uri: document.uri.toString(),
    });
    for (const diagram of details.diagrams) {
      const range = spanToVSCodeRange(diagram.span);

      const message: DiagramMessage = {
        kind: "diagram",
        svg: diagram.svg,
      };

      // This command will open the URI in the previewer (using the SVG extension).
      // But the SVG extension will call our `DiagramProvider` to extract the content
      // which, this case, simply means extracting the query parameter.
      ret.push(
        new vscode.CodeLens(range, {
          title: "Render Diagram",
          tooltip: diagram.tooltip,
          command: detailsCommand,
          arguments: [message],
        })
      );
    }

    for (const flatten of details.flattens) {
      const range = spanToVSCodeRange(flatten.span);

      const message: SourceMessage = {
        kind: "source",
        code: flatten.component,
      };
      ret.push(
        new vscode.CodeLens(range, {
          title: "Flatten Component",
          tooltip: flatten.tooltip,
          command: showFlattenedComponentCommand,
          arguments: [message],
        })
      );
    }

    //     for (const outline of details.outlines) {
    //       const start = new vscode.Position(
    //         outline.span.sl - 1,
    //         outline.span.sc - 1
    //       );
    //       const end = new vscode.Position(outline.span.el - 1, outline.span.ec - 1);
    //       const range = new vscode.Range(start, end);

    //       const message: MermaidMessage = {
    //         kind: "mermaid",
    //         chart: `classDiagram
    //     RLCModel o-- resistor
    //     RLCModel o-- capacitor
    //     RLCModel o-- inductor
    //     resistor <|-- Resistor
    //     capacitor <|-- Capacitor
    //     inductor <|-- Inductor
    //     Resistor <|-- TwoPin
    //     Capacitor <|-- TwoPin
    //     Inductor <|-- TwoPin
    //     class Resistor{
    //       +Resistance R
    //     }
    //     class Capacitor{
    //       Capacitance R
    //     }
    //     class TwoPin
    //     TwoPin --o p
    //     TwoPin --o n
    //     p <|-- Node
    //     n <|-- Node
    //     class Node {
    //         potential Voltage v
    //         flow Current i
    //     }
    // `,
    //       };

    //       // This should render the UML diagram for the specified class
    //       ret.push(
    //         new vscode.CodeLens(range, {
    //           title: "Render UML",
    //           tooltip: outline.tooltip,
    //           command: detailsCommand,
    //           arguments: [message],
    //         })
    //       );
    //     }

    console.log(`Found ${ret.length} CodeLenses in ${document.uri.toString()}`);
    return ret;
  }
}

const spanToVSCodeRange = (span: TextualSpan) => {
  const start = new vscode.Position(span.sl - 1, span.sc - 1);
  const end = new vscode.Position(span.el - 1, span.ec - 1);
  return new vscode.Range(start, end);
};
