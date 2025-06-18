/**
 * This is like the `filter` method for an array except that it works on
 * `Record` instances and it filters the values based on whether they belong to
 * a particular subtype and then returns the entries associated with those
 * values.
 *
 * @param obj A record mapping strings to values of type `V`
 * @param pred A predicate that identifies if a particular value is actually of
 * type `T` which is a subtype of type `V`.
 * @returns Record entries where only values that are of type `T` are still
 * present,
 */
export function filterEntries<V, T extends V>(
  obj: Record<string, V>,
  pred: (x: V) => x is T
): Array<[string, T]> {
  return Object.entries(obj).filter(
    (entry: [string, V]): entry is [string, T] => {
      return pred(entry[1]);
    }
  );
}

/**
 * This is like the `filter` method for an array except that it works on
 * `Record` instances and it filters the values based on whether they belong to
 * a particular subtype and then returns a Record containing only those values.
 *
 * @param obj A record mapping strings to values of type `V`
 * @param pred A predicate that identifies if a particular value is actually of
 * type `T` which is a subtype of type `V`.
 * @returns A record where only values that are of type `T` are still present,
 */
export function filterRecord<V, T extends V>(
  obj: Record<string, V>,
  pred: (x: V) => x is T
): Record<string, T> {
  return Object.fromEntries(filterEntries(obj, pred));
}
