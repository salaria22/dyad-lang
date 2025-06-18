import { Subscription } from "rxjs";
import { LibraryProvider } from "../providers/index.js";

/**
 * This type is just used by the Workspace class to capture specific
 * information about libraries upon registration.
 */
export interface LibraryResources {
  uuid: string;
  provider: LibraryProvider;
  sub: Subscription;
}
