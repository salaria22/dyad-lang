export type FastURN<T extends string> = `urn:${T}:${string}`;

export class FastURNSpace<P extends string, D extends Record<string, any>> {
  private prefix: `urn:${P}:`;
  constructor(protected nid: P, protected destruct: (nss: string) => D) {
    this.prefix = `urn:${nid}:`;
  }
  is(e: string): e is FastURN<P> {
    return e.startsWith(this.prefix);
  }
  create(nss: string): FastURN<P> {
    return `${this.prefix}${nss}`;
  }
  unparse(e: FastURN<P>): D {
    const nss = e.slice(this.prefix.length);
    return this.destruct(nss);
  }
}
