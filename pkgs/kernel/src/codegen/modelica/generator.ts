import { CodeGenerator } from "../generator.js";
import { DyadLibrary } from "@juliacomputing/dyad-ast";
import { QueryHandler } from "../../workspace/index.js";
import { Output } from "./output.js";
import { generateModelicaCode } from "./library.js";

export class ModelicaGenerator implements CodeGenerator {
  generate(query: QueryHandler, library: DyadLibrary, output: Output) {
    // FIX: Traverse all modules
    let cur: string[] = [];
    output.startModule(cur);
    const ret = generateModelicaCode(query, library, [], output);
    output.endModule(cur);
    return ret;
  }
}
