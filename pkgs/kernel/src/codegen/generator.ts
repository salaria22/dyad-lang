import { DyadLibrary } from "@juliacomputing/dyad-ast";
import { QueryHandler } from "../workspace/index.js";
import { Output } from "./modelica/output.js";
import { Problem } from "@juliacomputing/dyad-common";

export interface CodeGenerator {
  generate(
    query: QueryHandler,
    library: DyadLibrary,
    output: Output
  ): Array<Problem<unknown>>;
}
