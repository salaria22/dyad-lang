/**
 * Maps metric prefixes to their numerical value.
 *
 * @category Constants
 *
 * @see https://en.wikipedia.org/wiki/Metric_prefix
 */
export const prefixFactors = new Map<string, number>(
  Object.entries({
    Q: 1e30,
    R: 1e27,
    Y: 1e24,
    Z: 1e21,
    E: 1e18,
    P: 1e15,
    T: 1e12,
    G: 1e9,
    M: 1e6,
    k: 1e3,
    h: 1e2,
    da: 1e1,
    d: 1e-1,
    c: 1e-2,
    m: 1e-3,
    μ: 1e-6,
    u: 1e-6,
    n: 1e-9,
    p: 1e-12,
    f: 1e-15,
    a: 1e-18,
    z: 1e-21,
    y: 1e-24,
    r: 1e-27,
    q: 1e-30,
  })
);
