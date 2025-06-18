import { TextualSpan } from "@juliacomputing/dyad-ast";
import { requestName } from "../common.js";

/**
 * Instead of constantly pestering the server for information about locations
 * of definitions (for code lenses), SVGs for those definitions, location of
 * metadata
 */
export interface FileDetails {
  // This file's URI
  uri: string;
  // The file name
  filename: string;
  // Spans and diagrams that correspond to them
  diagrams: Array<EmbeddedDiagram>;
  // Outline associated with a given region
  outlines: Array<Outline>;
  // Expanded components
  flattens: Array<Flatten>;
  // All test cases, their names and their spans
  testableEntities: Array<TestableEntity>;
}

export interface Flatten {
  tooltip: string;
  component: string;
  span: TextualSpan;
}

export interface Outline {
  outline: DefinitionOutline;
  tooltip: string;
  span: TextualSpan;
}

export interface DefinitionOutline {
  typename: string;
  extends: Array<DefinitionOutline>;
  instances: Record<string, DefinitionOutline>;
}

export interface EmbeddedDiagram {
  tooltip: string;
  svg: string;
  span: TextualSpan;
}

export interface TestableEntity {
  label: string;
  filename: string;
  tests: IndividualTestCase[];
}

export interface IndividualTestCase {
  label: string;
  span: TextualSpan;
}

export interface FileDetailsRequestParams {
  uri: string;
}
export type FileDetailsResponseParams = FileDetails;

export const fileDetailsMethod = requestName("fileDetails");
