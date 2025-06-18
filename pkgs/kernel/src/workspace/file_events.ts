import { FileEvent } from "../providers/index.js";

import debug from "debug";
import { LibraryResources } from "./resources.js";
import { CompilerAssertionError } from "./errors.js";
import { updateAbstractSyntaxTree } from "./update.js";
import { WorkspaceNode } from "@juliacomputing/dyad-ast";
import { ProcessingEvent } from "./events.js";

const eventLog = debug("events:handle");

/**
 * This function is called in response to a FileEvent message from one of the
 * providers.  It takes care of sending out the "pre" tree event and then
 * calling `updateAbstractSyntaxTree` which takes care of updating the syntax
 * tree of the `DyadLibrary` node associated with that provider, updating
 * all the semantic attributes and then sending out the "post" event
 * indicating that the semantic processing is complete.
 * @param event
 */
export async function handleFileEvents(
  event: FileEvent,
  observableTree: WorkspaceNode,
  libraries: LibraryResources[],
  preload: (url: string) => Promise<void>
) {
  // FIX: Debounce file events so that multiple file events can be processed
  // in quick succession but defer tree reconstruction and semantic
  // processing.
  eventLog(">> Processing file event %s", event.transactionId);
  try {
    const resources = libraries.find((x) => x.uuid === event.uuid);
    /* istanbul ignore next */
    if (resources === undefined) {
      throw new CompilerAssertionError(
        event.uuid,
        `Unknown library provider id: ${event.uuid}`
      );
    }
    /**
     * Update abstract syntax tree
     */
    const urls = await updateAbstractSyntaxTree(
      event,
      resources.provider,
      observableTree
    );

    /**
     * Pre-fetch any URLs referenced by the files updates
     */
    await Promise.all(
      urls.map(async (url) => {
        await preload(url);
        eventLog("Preloaded %s", url);
      })
    );

    eventLog("<< Completed processing of file event %s", event.transactionId);
    // Note, it is very important that this event's transaction id get reused
    // because this is the transaction id known to whoever wrote the changees
    // that triggered this processing and they may wish to know when this
    // processing is completed so they'll be looking for this id.  Here we are
    // pushing this event into the rawTrees observable with this transaction id.
    // when it gets processed and the post tree event gets generated, it should
    // _also_ use this same transaction id.
    const externalEvent: ProcessingEvent = {
      kind: "external",
      transactionId: [event.transactionId],
      updateChecks: true,
    };
    eventLog(">> Pushed new raw tree processing event %s", event.transactionId);

    return externalEvent;
  } catch (err) {
    console.error(`Error while handling file events: `, err);
    // TODO: Submit a problem instead?
    throw err;
  }
}
