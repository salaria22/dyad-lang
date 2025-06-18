import { Problem } from "@juliacomputing/dyad-common";
import { Workspace } from "../workspace/index.js";
import { ComponentDefinition } from "@juliacomputing/dyad-ast";
import { LibraryModule } from "../providers/modules.js";

export function groupSubsystem(
  _workspace: Workspace,
  /** Definition that current contains the subcomponents */
  _def: ComponentDefinition,
  /** The names of the subcomponents involved */
  _components: string[],
  /** The name of the component definition that will be created */
  _newname: string,
  /** The library to place the new component definition in */
  _libraryName: string,
  /** The module, within that library, to place the new component definition in */
  _module: LibraryModule
): Problem[] {
  throw new Error("Unimplemented");
}
