import { fileExtension } from "@juliacomputing/dyad-common";
import { ProviderKey } from "@juliacomputing/dyad-kernel";
import { NodeAsyncFileSystem } from "@juliacomputing/dyad-kernel/node";
import debug from "debug";

const fslog = debug("fs:nowrite");

export class NodeNoWriteFileSystem extends NodeAsyncFileSystem {
  private unsaved: Record<string, string | Uint8Array> = {};
  override async readFile(filename: string): Promise<string | Uint8Array> {
    // If there is an unsaved file on the client side, return its contents
    // instead of what is on the file system.
    const temp = this.unsaved[filename];
    return temp ?? super.readFile(filename);
  }
  override async writeFile(
    filename: string,
    contents: string | ArrayBuffer
  ): Promise<void> {
    // If the file being written is Dyad source code, then we don't actually
    // write it because the request to write it originates from the frontend. We
    // assume that if the file doesn't contain Dyad source code then this method
    // was called by the code generator.
    if (filename.endsWith(`.${fileExtension}`)) {
      this.unsaved[filename] =
        typeof contents === "string" ? contents : Buffer.from(contents);
      fslog("Writing file %s to memory (for now)", filename);
    } else {
      await super.writeFile(
        filename,
        typeof contents === "string" ? contents : Buffer.from(contents)
      );
      fslog("Wrote file %s directly to disk", filename);
    }
  }

  async invalidate(providerKey: ProviderKey) {
    const filename = this.path(providerKey);
    delete this.unsaved[filename];

    fslog(
      "Got request to invalidate in memory version of %s, will revert to using version on file system",
      filename
    );
    const transactionId = this.generateTransactionId();
    await this.sendEvent(transactionId, { changed: [providerKey] }, false);
    fslog(
      "Event %s sent indicating file %s changed on filesystem",
      transactionId,
      filename
    );
    return transactionId;
  }
}
