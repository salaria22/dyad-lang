import { TestController, Uri } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import {
  ListTestsResponseParams,
  listTestsMethod,
} from "./requestDefinitions/tests.js";

export async function updateTests(
  client: LanguageClient,
  controller: TestController
) {
  // When should this be triggered?
  const result = await client.sendRequest<ListTestsResponseParams>(
    listTestsMethod,
    {}
  );
  for (let i = 0; i < result.tests.length; i++) {
    const test = result.tests[i];
    const item = controller.createTestItem(
      test.label,
      test.label,
      Uri.file(test.path)
    );
    controller.items.add(item);
    for (const child of test.children) {
      const citem = controller.createTestItem(
        child.label,
        child.label,
        Uri.file(child.path)
      );
      item.children.add(citem);
    }
  }
}
