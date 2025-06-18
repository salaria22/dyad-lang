import { TextDocument } from "vscode-languageserver-textdocument";
import {
  createConnection,
  TextDocumentChangeEvent,
  TextDocuments,
} from "vscode-languageserver/node";
import { SharedExtensionVariables } from "./shared.js";
import {
  fileProblems,
  Selector,
  stringifyProblem,
} from "@juliacomputing/dyad-kernel";
import { Maybe } from "purify-ts";
import { FileContents } from "@juliacomputing/dyad-ast";
import { sendDiagnostics } from "./diagnostics.js";
import { firstValueFrom, Subscription } from "rxjs";
import { DocumentContext, getContext } from "./context.js";
import { NodeNoWriteFileSystem } from "./nodefs.js";
import debug from "debug";

const doclog = debug("jss:documents");

/**
 * Information that we store away about every open file.  We collect/update this
 * whenever the file is opened or changed.
 */
interface OpenFileInformation {
  version: number;
  selector: Selector<Maybe<FileContents>>;
  sub: Subscription;
}

/**
 * This is called once the connection has been made to register document handlers.  The Workspace
 * doesn't yet exist, but via the `shared` object we can access relevant information once
 * it comes online.
 */
export function registerDocuments(
  connection: ReturnType<typeof createConnection>,
  shared: SharedExtensionVariables
) {
  /** If a documents Uri appears as a key, it is open.  The value is the `OpenFileInformation`. */
  const open = new Map<string, OpenFileInformation>();
  const documents = new TextDocuments(TextDocument);

  /**
   * When the workspace becomes available, subscribe to it and monitor the
   * annotatedTree for updates.  Whenever a new annotated tree becomes
   * available, and therefore the static checks have potentially been updated,
   * send all diagnostics for open files to the client.
   */
  firstValueFrom(shared.workspaceObservable)
    .then((workspace) => {
      console.log("Workspace came online");

      doclog("Registering onDidSave handler");
      /** Handle saves so we know the ephemeral version doesn't exist anymore */
      documents.onDidSave((change) => {
        getContext(change.document.uri, shared).ifJust((c) => {
          doclog("onDidSave for %s", change.document.uri);
          // Update the provider with the ephemeral version of this file
          if (c.provider instanceof NodeNoWriteFileSystem) {
            c.provider.invalidate(c.key).catch(console.error);
          }
        });
      });

      doclog("Registering onDidClose handler");
      /** Handle documents being closed */
      documents.onDidClose((change) => {
        doclog("onDidClose called for %s", change.document.uri);
        const info = open.get(change.document.uri);
        if (info) {
          doclog(
            "Unsubscribing from issues associated with %s",
            change.document.uri
          );
          info.sub.unsubscribe();
        }
        open.delete(change.document.uri);
      });

      const handleChange = (
        c: DocumentContext,
        change: TextDocumentChangeEvent<TextDocument>
      ) => {
        // Store this as an "open" file.  We don't trap onDidOpen because it is
        // always (seemingly) followed by onDidChangeContent so we only need to
        // handle one of them.
        if (!open.has(change.document.uri)) {
          doclog(
            "Subscribing to issues associated with file %s",
            change.document.uri
          );
          const problems = workspace.follow(fileProblems(c.entity));
          const sub = problems.subscribe((problems) => {
            if (problems.length > 0) {
              console.log("Problems for file ", c.entity);
              for (const prob of problems) {
                console.warn(stringifyProblem(prob));
              }
            }
            sendDiagnostics(
              connection,
              change.document.uri,
              change.document.version,
              problems
            );
          });
          open.set(change.document.uri, {
            version: change.document.version,
            selector: c.selector,
            sub,
          });
        } else {
          doclog(
            "Document %s changed, but wasn't open?!?",
            change.document.uri
          );
        }

        doclog("Updating ephemeral version of %s", change.document.uri);
        // Update the provider with the ephemeral version of this file
        shared
          .queue(
            updateEphemeral(shared, change, c),
            `Writing ${change.document.uri}`
          )
          .catch(console.error);
      };

      doclog("Registering onDidChangeContent handler");
      /** Handle documents being updated */
      documents.onDidChangeContent((change) => {
        doclog("onDidChangeContent called for %s", change.document.uri);
        getContext(change.document.uri, shared).caseOf({
          Just: (c) => handleChange(c, change),
          Nothing: () => {
            doclog("No DocumentContext found during onDidChangeContent");
          },
        });
      });
    })
    .catch(console.error);

  return documents;
}

function updateEphemeral(
  shared: SharedExtensionVariables,
  change: TextDocumentChangeEvent<TextDocument>,
  c: DocumentContext
) {
  return async () => {
    doclog("Ephemeral change to %s", change.document.uri);

    const id = await c.provider.set(c.key, change.document.getText());
    doclog(
      "File %s saved, transaction id is %s",
      change.document.uri,
      id.transactionId
    );
    if (shared.workspace.isJust()) {
      doclog("Waiting for transaction %s", id.transactionId);
      try {
        await shared.workspace.unsafeCoerce().waitForId(id.transactionId);
        doclog("Transaction %s completed successfully", id.transactionId);
      } catch (e) {
        console.error(`Error waiting for transaction ${id.transactionId}: `, e);
      }
    }
  };
}
