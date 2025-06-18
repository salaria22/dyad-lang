import { NonScalarTypeError } from "../../workspace/errors.js";
import { Output } from "./output.js";
import {
  FileLevelNode,
  hasExpression,
  qualifiedName,
  TextualSpan,
} from "@juliacomputing/dyad-ast";
import {
  ResolvedScalarType,
  ResolvedType,
} from "../../workspace/types/index.js";
import { problemSpan } from "../../workspace/utils.js";
import {
  failedResult,
  Nullable,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";

export function emitModelicaType(
  typename: string,
  r: Result<ResolvedType>,
  output: Output,
  context: FileLevelNode,
  span: Nullable<TextualSpan>
) {
  output.startFile(typename);

  const result = r.chain(
    (s): Result<ResolvedScalarType> =>
      s.resolves === "scalar"
        ? successfulResult(s)
        : failedResult(
            new NonScalarTypeError(
              typename,
              `Expected typename ${typename} to be a scalar`,
              problemSpan(context, span)
            )
          )
  );
  const problems = r.problems();

  for (const e of problems) {
    output.writeLine(`# Problem: ${e.title} - ${e.details}`);
  }
  result.ifResult((t) => {
    const units = t.mods["units"];
    let mods = "";
    if (units && hasExpression(units) && units.expr.type === "slit") {
      mods = `unit="${units.expr.value}"`;
    }

    output.writeLine(`type ${typename} = ${qualifiedName(t.base)}(${mods});`);
  }, []);
  output.endFile(typename);
}
