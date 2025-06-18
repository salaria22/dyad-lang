export type ComparatorFunction<T> = (x: T, y: T) => boolean;

export class DisjointSets<T> {
  private sets: Array<Array<T>> = [];
  constructor(
    init: Array<T> = [],
    protected comp: ComparatorFunction<T> = identityComparator
  ) {
    for (const elem of init) {
      this.add(elem);
    }
  }
  has(elem: T): boolean {
    return this.belongsTo(elem) >= 0;
  }
  belongsTo(elem: T): number {
    for (let i = 0; i < this.sets.length; i++) {
      const row = this.sets[i];
      if (row.some((x) => this.comp(x, elem))) {
        return i;
      }
    }
    return -1;
  }
  upsert(elem: T) {
    if (this.has(elem)) {
      return;
    }
    this.add(elem);
  }
  add(elem: T) {
    // Make sure it isn't already in a set somewhere
    if (this.has(elem)) {
      throw new Error(`Adding element that is already in a set`);
    }
    // Make sure it isn't already in a set somewhere
    for (const row of this.sets) {
      if (row.some((x) => this.comp(x, elem))) {
        throw new Error(`Adding element that is already in a set`);
      }
    }
    this.sets.push([elem]);
  }
  join(e1: T, e2: T) {
    const i1 = this.belongsTo(e1);
    const i2 = this.belongsTo(e2);
    if (i1 === -1 || i2 === -1) {
      throw new Error(`Attempted to join elements not in set`);
    }
    if (i1 === i2) {
      return;
    }
    const min = Math.min(i1, i2);
    const max = Math.max(i1, i2);
    const merged = [...this.sets[min], ...this.sets[max]];
    this.sets = [...this.sets.slice(0, max), ...this.sets.slice(max + 1)];
    this.sets[min] = merged;
  }
  multiJoin(...e1: T[]) {
    for (let i = 1; i < e1.length; i++) {
      this.join(e1[0], e1[i]);
    }
  }
  getSet(n: number) {
    return this.sets[n];
  }
  getSets() {
    return this.sets;
  }
  stringify(f: (x: T) => string): string {
    return JSON.stringify(this.sets.map((row) => row.map(f)));
  }
  size() {
    return this.sets.length;
  }
}

const identityComparator: ComparatorFunction<any> = (x, y) => x === y;
