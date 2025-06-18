import { Problem } from "@juliacomputing/dyad-common";
import { requestName } from "../common.js";

export interface CompileRequestParams {}

export interface CompileResponseParams {
  failures: Record<string, string>;
  problems: Problem[];
}

export const compileMethod = requestName("compile");
