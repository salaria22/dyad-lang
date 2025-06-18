import { Subject, filter } from "rxjs";
import { FileEvent, LibraryProvider } from "../providers/index.js";
import { lastValue } from "../providers/last.js";
import { CompilerAssertionError } from "./errors.js";
import { LibraryResources } from "./resources.js";
import debug from "debug";

const registerLog = debug("events:registration");

export async function registerProvider(
  provider: LibraryProvider,
  libraries: LibraryResources[],
  events: Subject<FileEvent>
) {
  // Run any subclass specific initialization before we do anything else.  This allows
  // any async resources to be loaded.  This is important because, up to this point, we
  // many not have an accessible Project.toml file available to the provider.
  await provider.init();

  // Fetch the project information for the new provider
  const proj = lastValue(provider.project());

  /** Iterate over the other libraries */
  for (const lib of libraries) {
    // Fetch their project information
    const lproj = lastValue(lib.provider.project());
    /* istanbul ignore next */
    if (proj.name === lproj.name) {
      // If a duplicate library was found, throw an error
      throw new CompilerAssertionError(
        proj.name,
        `A project with the name ${proj.name} already exists`
      );
    }
  }

  /** Now subscribe to any future events from this provider */
  const sub = provider.events
    // If the provider is already connected (it may not be, that happens later)
    // then handle this event.  Any events that happen before connection are just
    // ignored.
    .pipe(filter(() => libraries.map((res) => res.provider).includes(provider)))
    .subscribe({
      next: (v) => events.next(v),
      error: (e) => {
        console.error(
          `Provider ${provider.uuid()} event pipeline contained an error: ${
            e.message
          }`
        );
      },
    });

  /**
   * Stashing away these details (in particular the subscription) so that we can
   * properly "close" or "shutdown" this workspace later and free all the
   * appropriate resources.
   */
  const resources: LibraryResources = {
    uuid: proj.uuid,
    provider,
    sub,
  };

  // Add this library (and its resources) to the set of libraries the workspace
  // is tracking.
  libraries.push(resources);

  // This connection will trigger a file event as the files from this provider
  // come online.  This is returning the id for that transaction.  Knowing the
  // transaction (by returning it as a promise from this registration process)
  // allows the client to know about (and, more importantly, wait for) that
  // transaction to be processed (i.e., for all the files to be in place
  // and semantically processed!)
  try {
    const id = await provider.connect();
    registerLog("Connect yielded event with id %s", id);
    return id.transactionId;
  } catch (e) {
    console.error(e);
    throw e;
  }
}
