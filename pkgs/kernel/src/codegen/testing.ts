import { sourceKey } from "@juliacomputing/dyad-ast";
import {
  InMemoryLibraryProvider,
  stringifyProject,
} from "../providers/index.js";
import { Workspace } from "../workspace/workspace.js";
import { sourceFolder } from "@juliacomputing/dyad-common";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import { ZipProvider } from "../providers/zip.js";
import { CodeGenKey, ModuleName } from "./mtk/events.js";
import { FSHandler } from "./mtk/fshandler.js";
import { InMemoryFileSystem } from "../providers/memfs.js";
import { queryRawFiles } from "../workspace/index.js";

export const projectRLC = `
name="RLC"
uuid="abc123"
version="0.1.0"
authors=["Michael M. Tiller <michael.tiller@juliahub.com>"]`;

export async function loadWorkspaceToZip(
  libname: string,
  sources: Record<string, string>
) {
  const blobWriter = new BlobWriter();
  const writer = new ZipWriter(blobWriter);
  const addFile = async (filename: string, contents: string) => {
    const blob = new Blob([contents]);
    const reader = new BlobReader(blob);
    await writer.add(filename, reader);
  };
  await addFile(
    "./Project.toml",
    stringifyProject({
      name: libname,
      authors: [],
      uuid: "abc123-" + libname,
      version: "0.1.0",
    })
  );
  for (const [filename, contents] of Object.entries(sources)) {
    await addFile(`./${sourceFolder}/${filename}`, contents);
  }

  const workspace = await Workspace.create();
  await writer.close();

  const fileBlob = await blobWriter.getData();
  await fileBlob.arrayBuffer();

  const zip = new ZipProvider(fileBlob);

  const id = await workspace.registerProvider(zip);
  await workspace.waitForId(id);

  const files = workspace.query(queryRawFiles());
  const issues = files.flatMap((file) => file.problems);

  return { workspace, zip, issues };
}
/**
 * This function can be used for testing by easily provisioning a workspace and
 * loading it with some source files.
 * @param libname Library to add
 * @param sources Sources to add
 * @returns both the workspace and in memory library provider
 */
export async function loadWorkspace(
  libname: string,
  sources: Record<string, string>
) {
  const workspace = await Workspace.create();
  const inmem = await addLibrary(libname, workspace, sources);

  const files = workspace.query(queryRawFiles());
  const issues = files.flatMap((file) => file.problems);
  return { workspace, inmem, issues };
}

export async function addLibrary(
  libname: string,
  workspace: Workspace,
  sources: Record<string, string>
) {
  const inmem = new InMemoryLibraryProvider({
    name: libname,
    authors: [],
    uuid: "abc123-" + libname,
    version: "0.1.0",
  });
  const id = await workspace.registerProvider(inmem);
  await workspace.waitForId(id);

  for (const [file, source] of Object.entries(sources)) {
    const txn = await inmem.set(sourceKey(file, []), source);
    await workspace.waitForId(txn.transactionId);
  }
  return inmem;
}

export class SnapshotHandler extends FSHandler {
  constructor(protected expectedModules: Array<ModuleName>) {
    super(new InMemoryFileSystem());
  }
  async modules(all: Array<ModuleName>): Promise<void> {
    await super.modules(all);
    expect(all).toEqual(this.expectedModules);
  }
  async source(key: CodeGenKey, code: string): Promise<void> {
    await super.source(key, code);
    expect({ key, code }).toMatchSnapshot();
  }
  async close(): Promise<void> {
    expect(this.fs instanceof InMemoryFileSystem).toEqual(true);
    if (this.fs instanceof InMemoryFileSystem) {
      const fs = this.fs;
      expect(fs.toJSON()).toMatchSnapshot();
    }
  }
}
