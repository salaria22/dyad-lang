export interface LazyOptions<T> {
  defaultValue?: T;
}

/**
 * This function attempts to fetch a cached value from a WeakMap and if it is
 * unable to find a value currently in that map it uses the supplied function to
 * lazily evaluate a value and then places it in the cache.
 *
 * The default value here is used to avoid infinite recursion.  It provides a default
 * value that, if present, is injected temporary while the real value is computed.  That
 * way if another evaluation is requested for the same key, it doesn't recurse infinitely
 * and the temporary value will be returned.
 *
 * @param key
 * @param cache
 * @param f
 * @param options A default value to inject temporarily while computing the actual value
 * @returns
 */
export function lazyEval<K extends object, T>(
  key: K,
  cache: WeakMap<K, T>,
  f: () => T,
  options: LazyOptions<T> = {}
): T {
  const ret = cache.get(key);
  if (ret === undefined) {
    if (options.defaultValue !== undefined) {
      cache.set(key, options.defaultValue);
    }
    const value = f();
    cache.set(key, value);
    return value;
  }
  return ret;
}
