import * as toml from "@gulujs/toml";

/**
 * Information parsed from the Project.toml file
 */
export interface ProjectTOML {
  /**
   * Library name, very important and never specified by the Dyad
   * code so we must fetch it from here.
   */
  name: string;
  /**
   * A unique identifier associated with each Julia library
   */
  uuid: string;
  /**
   * The version number of the Julia library
   */
  version: string;
  /**
   * Project authors
   */
  authors: string[];
  /**
   * Potential dependencies.  Each record has a package name as the key
   * and the projects UUID as the value.
   */
  deps?: Record<string, string>;
  /**
   * Optional Dyad-specific configuration section.
   */
  dyad?: Record<string, any>; // Or a more specific type if known
  /**
   * Optional list of tags associated with the project.
   */
  tags?: string[];
}

export function stringifyProject(p: ProjectTOML): string {
  return toml.stringify(p as any);
}

export function parseProject(s: string): ProjectTOML {
  return toml.parse(s) as any as ProjectTOML;
}
