export function partition<T>(a: T[], f: (x: T) => boolean): [T[], T[]] {
  const s: T[] = [];
  const t: T[] = [];
  for (const elem of a) {
    if (f(elem)) {
      s.push(elem);
    } else {
      t.push(elem);
    }
  }
  return [s, t];
}

export type Exclude<T, U> = T extends U ? never : T;

export function partitionByType<T, S extends T>(
  a: T[],
  f: (x: T) => x is S
): [Array<S>, Array<Exclude<T, S>>] {
  const s: S[] = [];
  const t: Array<Exclude<T, S>> = [];
  for (const elem of a) {
    if (f(elem)) {
      s.push(elem);
    } else {
      t.push(elem as Exclude<T, S>);
    }
  }
  return [s, t];
}
