import objectHash from "object-hash";
import {
  Definition,
  isDefinition,
  isDyadModule,
  DyadModule,
} from "@juliacomputing/dyad-ast";
import { assertUnreachable } from "@juliacomputing/dyad-common";
import { unparseDyad } from "@juliacomputing/dyad-parser";
import { EntityNode } from "./entities.js";
import { listAllModules } from "../selectors/modules.js";
import { FastURN, FastURNSpace } from "./fast.js";

export type SemanticHash = FastURN<"semantic">;
export type ContentHash = FastURN<"content">;

const semanticSpace = new FastURNSpace("semantic", (hash) => ({ hash }));
const contentSpace = new FastURNSpace("content", (hash) => ({ hash }));

export type Hash = ContentHash | SemanticHash;

export function hashesDiffer(a: Hash, b: Hash): boolean {
  if (semanticSpace.is(a) && semanticSpace.is(b)) {
    return a !== b;
  }
  if (contentSpace.is(a) && contentSpace.is(b)) {
    return a !== b;
  }
  return false;
}

export interface EntityHashes {
  semanticHash: string;
  contentHash: string;
}

export type HashableEntity = DyadModule | Definition;

/**
 * This function computes both the semantic hash and the content hash for a
 * hashable entity.  Currently, only `DyadModule`s and `Definition`s are
 * hashable in this way.
 *
 * @param node
 * @returns
 */
export function computeHashes(node: HashableEntity): EntityHashes {
  if (isDyadModule(node)) {
    const semanticHashes: string[] = [];
    const contentHashes: string[] = [];
    for (const file of node.files) {
      semanticHashes.push(unparseDyad(file, "", { semanticOnly: true }));
      contentHashes.push(unparseDyad(file, "", { semanticOnly: false }));
    }
    const contentHash = objectHash(contentHashes, { algorithm: "sha1" });
    const semanticHash = objectHash(semanticHashes, { algorithm: "sha1" });
    return { contentHash, semanticHash };
  } else if (isDefinition(node)) {
    const contentHash = objectHash(unparseDyad(node), { algorithm: "sha1" });
    const semanticHash = objectHash(
      unparseDyad(node, "", { semanticOnly: true }),
      { algorithm: "sha1" }
    );
    return { contentHash, semanticHash };
  } else {
    assertUnreachable(node);
  }
}

/**
 * This function computes the semantic and content hashes of a given entity node
 *
 * @param node
 * @returns
 */
export function hashNode(node: EntityNode): EntityHashes {
  switch (node.kind) {
    case "lib": {
      const mods = listAllModules(node);
      const semanticTree: Record<string, string> = {};
      const contentTree: Record<string, string> = {};
      for (const [key, mod] of mods.entries()) {
        const hashes = hashNode(mod);
        semanticTree[key] = hashes.semanticHash;
        contentTree[key] = hashes.contentHash;
      }
      const semanticHash = objectHash(semanticTree);
      const contentHash = objectHash(contentTree);
      return { semanticHash, contentHash };
    }
    case "module": {
      const semanticHashes: string[] = [];
      const contentHashes: string[] = [];
      for (const file of node.files) {
        const fhashes = hashNode(file);
        semanticHashes.push(fhashes.semanticHash);
        contentHashes.push(fhashes.contentHash);
      }
      const contentHash = objectHash(contentHashes, { algorithm: "sha1" });
      const semanticHash = objectHash(semanticHashes, { algorithm: "sha1" });
      return { contentHash, semanticHash };
    }
    case "raw": {
      return {
        semanticHash: objectHash(unparseDyad(node, "", { semanticOnly: true })),
        contentHash: objectHash(unparseDyad(node, "", { semanticOnly: false })),
      };
    }
    case "file": {
      const uses = node.uses.map((n) =>
        unparseDyad(n, "", { semanticOnly: true })
      );
      const semanticHash = objectHash(uses);
      const contentHash = unparseDyad(node, "", { semanticOnly: false });
      return { semanticHash, contentHash };
    }
    case "adef":
    case "cdef":
    case "enum":
    case "fun":
    case "scalar":
    case "sclcon":
    case "strcon":
    case "struct": {
      const contentHash = objectHash(unparseDyad(node), { algorithm: "sha1" });
      const semanticHash = objectHash(
        unparseDyad(node, "", { semanticOnly: true }),
        { algorithm: "sha1" }
      );
      return { contentHash, semanticHash };
    }
    default: {
      assertUnreachable(node);
    }
  }
}
