export type LibraryModule = string[];

export function sameModule(a: LibraryModule, b: LibraryModule): boolean {
  return a.length === b.length && a.every((path, i) => path === b[i]);
}
