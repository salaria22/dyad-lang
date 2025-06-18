import { FileKey } from "@juliacomputing/dyad-ast";
import { assertUnreachable } from "@juliacomputing/dyad-common";

export interface JuliaSourceKey {
  kind: "julia";
  mod: string[];
  file: string;
}

export function juliaSourceKey(file: string, mod: string[]): JuliaSourceKey {
  return { kind: "julia", file, mod };
}

export function isJuliaSourceKey(key: ProviderKey): key is JuliaSourceKey {
  return key.kind === "julia";
}

export interface JuliaTestKey {
  kind: "test";
  mod: string[];
  file: string;
}

// Add so we can read and write Project.toml
export interface ProjectKey {
  kind: "proj";
}

export const projectKey: ProjectKey = { kind: "proj" };

export interface ManifestKey {
  kind: "manifest";
}

export const manifestKey: ManifestKey = { kind: "manifest" };

export function juliaTestKey(file: string, mod: string[]): JuliaTestKey {
  return { kind: "test", file, mod };
}

export function isJuliaTestKey(key: ProviderKey): key is JuliaTestKey {
  return key.kind === "test";
}

export function sameProviderKey(a: ProviderKey, b: ProviderKey): boolean {
  switch (a.kind) {
    case "src":
    case "julia":
    case "test":
      return (
        b.kind === a.kind &&
        a.file === b.file &&
        a.mod.length === b.mod.length &&
        a.mod.every((v, i) => v === b.mod[i])
      );
    case "asset":
      return b.kind === a.kind && a.file === b.file;
    case "proj":
    case "manifest":
      return b.kind === a.kind;
    /* istanbul ignore next */
    default:
      assertUnreachable(a);
  }
}

export type ProviderKey =
  | FileKey
  | JuliaSourceKey
  | JuliaTestKey
  | ProjectKey
  | ManifestKey;

export interface ProviderKeyCases<R> {
  source: (file: string, module: string[]) => R;
  asset: (file: string) => R;
  julia: (file: string, module: string[]) => R;
  test: (file: string, module: string[]) => R;
  project: () => R;
  manifest: () => R;
}

export function switchProviderKey<T>(
  key: ProviderKey,
  cases: ProviderKeyCases<T>
) {
  switch (key.kind) {
    case "src": {
      return cases.source(key.file, key.mod);
    }
    case "asset": {
      return cases.asset(key.file);
    }
    case "julia": {
      return cases.julia(key.file, key.mod);
    }
    case "test": {
      return cases.test(key.file, key.mod);
    }
    case "proj": {
      return cases.project();
    }
    case "manifest": {
      return cases.manifest();
    }
    /* istanbul ignore next */
    default: {
      assertUnreachable(key);
    }
  }
}
