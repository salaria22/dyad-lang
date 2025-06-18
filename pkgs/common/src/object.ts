/**
 * Determines whether the value `x` is an `object` (see
 * https://stackoverflow.com/questions/13045419/javascript-is-there-an-isobject-function-like-isarray)
 *
 * @param x A Javascript value
 * @returns whether the value is an object
 */
export function isObject(x: any): x is Record<string | number, unknown> {
  return (
    (typeof x === "object" || typeof x === "function") &&
    !Array.isArray(x) &&
    x !== null
  );
}

/**
 * Map the values of an object
 * @param obj Object to map over
 * @param f Function to apply to values
 * @returns Mapped object
 */
export function objectMap<T, R>(
  obj: Record<string, T>,
  f: (x: T) => R
): Record<string, R> {
  const ent = Object.entries(obj);
  const mapped: Array<[string, R]> = ent.map(([k, v]) => [k, f(v)]);
  return Object.fromEntries(mapped);
}

/**
 * Map the selected values of an object
 * @param rec Object to map over
 * @param pred Predicate to select values to keep
 * @param f Function to map selected values
 * @returns Mapped object
 */
export function objectFilterMap<T, U extends T, R>(
  obj: Record<string, T>,
  pred: (x: T) => x is U,
  f: (x: U) => R
): Record<string, R> {
  const ret: Record<string, R> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (pred(v)) {
      ret[k] = f(v);
    }
  }
  return ret;
}

/**
 * Check if all values in an object are of a particular type
 *
 * @param obj Object to check
 * @param f Predicate to indicate if value is of the appropriate subtype
 * @returns
 */
export function objectAll<T, U extends T>(
  obj: Record<string, T>,
  f: (x: T) => x is U
): obj is Record<string, U> {
  for (const v of Object.values(obj)) {
    if (!f(v)) {
      return false;
    }
  }
  return true;
}
