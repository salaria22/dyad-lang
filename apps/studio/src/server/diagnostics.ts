import { isTextProblem } from "@juliacomputing/dyad-ast";
import { Problem, problemMessage } from "@juliacomputing/dyad-common";
import {
  Diagnostic,
  createConnection,
  DiagnosticSeverity,
} from "vscode-languageserver/node";
import { spanToRange } from "./range.js";

export function sendDiagnostics(
  connection: ReturnType<typeof createConnection>,
  documentUri: string,
  documentVersion: number | null,
  problems: Array<Problem<unknown>>
) {
  const diagnostics: Diagnostic[] = [];

  for (const problem of problems) {
    if (isTextProblem(problem)) {
      try {
        const span = problem.extra.span;
        if (span !== null) {
          const range = spanToRange(span);
          const msg: string = `${problem.title}: ${problem.details}`;
          const severity: DiagnosticSeverity =
            problem.severity === "error"
              ? 1
              : problem.severity === "warning"
                ? 2
                : 3;
          diagnostics.push(Diagnostic.create(range, msg, severity));
          continue;
        }
      } catch (e) {
        console.error(`Error caught building diagnostic for: `);
        console.error(JSON.stringify(problem, null, 4));
        console.error("Error: ", e);
      }
    }
    console.warn("Got problem without span: ", problemMessage(problem));
  }
  if (documentVersion === null) {
    connection
      .sendDiagnostics({
        uri: documentUri,
        diagnostics: diagnostics,
      })
      .catch(console.error);
  } else {
    connection
      .sendDiagnostics({
        uri: documentUri,
        version: documentVersion,
        diagnostics: diagnostics,
      })
      .catch(console.error);
  }
}
