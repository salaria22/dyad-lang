import { Nullable } from "@juliacomputing/dyad-common";
import { requestName } from "../common.js";
import { Range } from "vscode-languageserver/node";

export interface TestableEntity {
  label: string;
  /** Fully qualified path to the file */
  path: string;
  children: IndividualTests[];
  range: Nullable<Range>;
}

export interface IndividualTests {
  label: string;
  /** Fully qualified path to the file */
  path: string;
  range: Nullable<Range>;
}

export interface ListTestsRequestParams {}
export interface ListTestsResponseParams {
  tests: TestableEntity[];
}

export const listTestsMethod = requestName("listTests");
