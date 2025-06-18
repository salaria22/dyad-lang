import { TextualSpan } from "@juliacomputing/dyad-ast";
import { Range } from "vscode-languageserver/node";

export function spanToRange(span: TextualSpan) {
  const range = Range.create(
    {
      line: span.sl - 1,
      character: span.sc - 1,
    },
    {
      line: span.el - 1,
      character: span.ec, // I would expect a -1 here, but then I'm one char short?!?
    }
  );
  return range;
}
