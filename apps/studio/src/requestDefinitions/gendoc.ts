import { Problem } from "@juliacomputing/dyad-common";
import { requestName } from "../common.js";

export interface GenerateDocumentationRequestParams {}

export interface GenerateDocumentationResponseParams {
  problems: Problem[];
}

export const generateDocumentationMethod = requestName("gendoc");
