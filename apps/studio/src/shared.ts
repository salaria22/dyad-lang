import * as vscode from "vscode";

import { Maybe } from "purify-ts";
import { LanguageClient } from "vscode-languageclient/node";

export interface SharedClientInformation {
  client: Maybe<LanguageClient>;
  log: vscode.OutputChannel;
}

export function sharedClient(
  shared: SharedClientInformation,
  f: (client: LanguageClient) => void
) {
  shared.client
    .caseOf({
      Nothing: async () => {
        await vscode.window.showInformationMessage(
          `Could not access initialized client`
        );
      },
      Just: async (client) => f(client),
    })
    .catch(console.error);
}

export function asyncSharedClient(
  shared: SharedClientInformation,
  f: (client: LanguageClient) => Promise<void>
) {
  shared.client
    .caseOf({
      Nothing: async () => {
        await vscode.window.showInformationMessage(
          `Could not access initialized client`
        );
      },
      Just: (client) => f(client),
    })
    .catch(console.error);
}
