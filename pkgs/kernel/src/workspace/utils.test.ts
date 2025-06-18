import { Maybe } from "purify-ts/Maybe";
import { FailedResult, Problem, Result } from "@juliacomputing/dyad-common";
import {
  FileSystemInterface,
  ExistsOptions,
  LibraryProvider,
} from "../providers/index.js";
import { stringifyProblem } from "./utils.js";
import path from "path";
import { execSync } from "child_process";
import { Workspace } from "./workspace.js";
import { dyadWatchTargets, NodeAsyncFileSystem } from "../node/nodefs.js";
import { Either } from "purify-ts/Either";
import {
  DefinitionEntity,
  isDefinitionEntity,
  isModuleEntity,
  ModuleEntity,
} from "./index.js";
import debug from "debug";

const eventLog = debug("events:tests");

export const electricalTypes = `
type Foo = Real(max=1000)
type Bar = Foo(min=0, max=100)
type Voltage = Real(units="V")
type Current = Real(units="A")
`;

export const electricalConnector = `connector Pin
  potential v::Voltage
  flow i::Current
end
  `;

export const electricalComponents = `component Ground
  p = Pin()
relations
  p.v = 0
end
`;

export function assertIs<T, R extends T>(v: T, pred: (x: T) => x is R): R {
  expect(pred(v)).toEqual(true);
  if (pred(v)) {
    return v;
  }
  throw new Error("This will never happen");
}

export function assertIsDefined<T>(v: T | undefined): T {
  expect(v).toBeDefined();
  if (v !== undefined) {
    return v;
  }
  throw new Error("This will never happen");
}

export function assertJust<T>(x: Maybe<T>): T {
  expect(x.isJust()).toEqual(true);
  return x.unsafeCoerce();
}

export function assertNothing<T>(x: Maybe<T>) {
  expect(x.isNothing()).toEqual(true);
}

export function assertModuleEntity(e: string): ModuleEntity {
  if (isModuleEntity(e)) {
    return e;
  }
  expect(isModuleEntity(e)).toEqual(true);
  throw new Error("It will never get here");
}

export function assertDefinitionEntity(e: string): DefinitionEntity {
  if (isDefinitionEntity(e)) {
    return e;
  }
  expect(isDefinitionEntity(e)).toEqual(true);
  throw new Error("It will never get here");
}

export function assertRight<T>(x: Either<any, T>): T {
  return x.caseOf<T>({
    Left: (e) => {
      expect(e).toEqual({});
      throw new Error("It will never get here");
    },
    Right: (v) => {
      return v;
    },
  });
}

export function assertLeft(x: Either<Problem, any>): Problem {
  expect(x.isLeft()).toEqual(true);
  return x.leftToMaybe().unsafeCoerce();
}

export function assertFailed(x: Result<any>, type?: string) {
  expect(x instanceof FailedResult).toEqual(true);
  if (x instanceof FailedResult && type !== undefined) {
    const nativeErrors = x
      .problems()
      .filter((x) => x.type === "expected-problem");
    for (const e of nativeErrors) {
      console.error(e);
    }
    const types = x.problems().map((x) => x.type);
    expect(types).toContain(type);
  }
}

export function assertHasResult<T>(
  r: Result<T>,
  allowPartial: boolean = true
): T {
  return r.caseOf({
    success: (v) => v,
    warnings: (v, w) => {
      if (allowPartial) {
        return v;
      }
      expect(w.map(stringifyProblem)).toEqual([]);
      throw new Error("Expected successful result, got partial result");
    },
    errors: (e) => {
      expect(e).toEqual([]);
      throw new Error("Expected successful or partial result, but got failure");
    },
  });
}

export class TestingFS implements FileSystemInterface {
  public directories: string[] = [];
  public files: Map<string, string> = new Map();
  async mkdir(filepath: string): Promise<void> {
    this.directories.push(filepath);
  }
  async rmdir(): Promise<void> {
    throw new Error("Function not implemented.");
  }
  async readdir(): Promise<string[]> {
    throw new Error("Function not implemented.");
  }
  async writeFile(filepath: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === "string") {
      this.files.set(filepath, data);
      return;
    }
    throw new Error("Function not implemented.");
  }
  async readFile(): Promise<string | Uint8Array> {
    throw new Error("Function not implemented.");
  }
  async unlink(): Promise<void> {
    throw new Error("Function not implemented.");
  }
  async rename(): Promise<void> {
    throw new Error("Function not implemented.");
  }
  async exists(filename: string, options?: ExistsOptions): Promise<boolean> {
    if (options?.type === "file") {
      return this.files.has(filename);
    }
    if (options?.type === "directory") {
      return this.directories.includes(filename);
    }
    return this.files.has(filename) || this.directories.includes(filename);
  }
}

/**
 * This function finds the root of the git repository (assuming you are in a directory of a git repository)
 * using the **synchronous** function `execSync`.
 * @returns The path to the root of the git repository
 */
function root(): string {
  return execSync("git rev-parse --show-toplevel").toString().trim();
}

export type ModuleProviders<K extends Record<string, string>> = {
  [P in keyof K]: LibraryProvider;
};

export async function loadModulesFromFS<T extends Record<string, string>>(
  map: T
): Promise<{ workspace: Workspace } & ModuleProviders<T>> {
  const workspace = await Workspace.create();
  try {
    const ret: ModuleProviders<T> = {} as any;
    const ids: string[] = [];
    for (const k in map) {
      try {
        const moduleName = map[k];
        const dir = path.join(root(), "pkgs", "kernel", "samples", moduleName);
        const provider = new NodeAsyncFileSystem(dir, dyadWatchTargets);
        const exists = await provider.exists(".");
        expect(exists).toEqual(true);
        const id = await workspace.registerProvider(provider);
        // TODO(a) This should be redundant, we have a race condition.
        eventLog("Awaiting event %s", id);
        await workspace.waitForId(id);
        eventLog("Got event %s", id);
        ids.push(id);
        ret[k] = provider;
      } catch (e) {
        console.error(`Error while registering provider ${k}`, e);
        throw e;
      }
    }
    // TODO(a) Uncommont this if race condition is solved.
    //await Promise.all(ids.map((id) => workspace.waitForId(id)));
    return { workspace, ...ret };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * This here because Jest complains if it isn't.  The issue here is that this
 * file is not really intended to be a test suite, it is intended to be a
 * collection of utility functions FOR tests.  I added the `.test.ts` subscript
 * so it wouldn't get bundled up with the _actual source code_.  But in naming
 * it that way, Jest expects it to contain a test suite...so here is one.
 *
 * One problem is that this test suite will (I think) always get run by any
 * script that imports the utility functions here.
 */

describe("Dummy test suite", () => {
  test("Dummy test case", () => {
    expect(2 + 3).toEqual(5);
  });
});

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, ms);
  });
}
