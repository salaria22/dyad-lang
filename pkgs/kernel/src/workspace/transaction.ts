import { isDefinition } from "@juliacomputing/dyad-ast";
import { Mutator } from "./selector.js";
import { ModifiableNode, Workspace } from "./workspace.js";
import { ClosedTransaction } from "./errors.js";
import { describeEntity } from "./entities/entities.js";
import { FileEntity } from "./entities/files.js";
import { runInAction } from "mobx";
import { getDefinitionRelations, getFileRelations } from "./selectors/index.js";

export interface TransactionOptions {
  /**
   * Set this to true if the raw tree should be updated with each modification.
   * You generally use this if some other part of the program needs to respond
   * immediately to the changes in the AST.  This only has an effect if the program
   * yields between calls to `modify`.
   *
   * Default is false
   **/
  immediate: boolean;
}

export class Transaction {
  /** The set of files modified as part of this transaction. */
  private modifiedFiles = new Set<FileEntity>();

  /** Whether this transaction is still open or has been committed */
  private open: boolean = true;

  constructor(
    protected workspace: Workspace,
    protected updateFiles: (files: FileEntity[]) => Promise<void>
  ) {}

  /**
   * Apply the given `Mutator` to the specified `nodeOrPath`
   *
   * @param node The `ASTNode` that the mutator should be applied to.
   * @param f The mutator to apply
   */
  modify<T extends ModifiableNode>(node: T, f: Mutator<T>): void {
    /**
     * Modify the root node and set that to the current workingRoot.
     */
    runInAction(() => f(node as any));

    /**
     * Now lookup up the file entity of the node we just modified.  NB - this
     * should be done **after** the modification in case the node has been
     * renamed.
     */
    const rels = isDefinition(node)
      ? this.workspace.query(getDefinitionRelations(node))
      : this.workspace.query(getFileRelations(node));
    if (!this.open) {
      throw new ClosedTransaction(
        rels.self,
        `Attempted to modify node at path '${describeEntity(
          rels.self
        )}' after a Transaction was either committed or reverted`
      );
    }

    const fileEntity = rels.kind === "file" ? rels.self : rels.file;

    // Record that this particular file has changed.
    this.modifiedFiles.add(fileEntity);
  }
  /**
   * This function commits all the changes that have been made **back to the
   * `LibraryProvider` and returns a `Promise<void>` that is resolved once
   * those changes have fully propagated through the annotated tree.
   */
  commit(): Promise<void> {
    this.open = false;
    // This ensures that we don't change the tree while something
    // has locked it.
    return this.workspace.runExclusively(() => {
      return this.updateFiles([...this.modifiedFiles]);
    });
  }
}
