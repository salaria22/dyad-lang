export interface Unit {
  /** Exponent for time, in seconds */
  s: number;
  /** Exponent for length, in meters */
  m: number;
  /** Exponent for mass, in kilograms */
  kg: number;
  /** Exponent for current, in amperes */
  A: number;
  /** Exponent for temperature, in kelvin */
  K: number;
  /** Exponent for amount of substacne, in moles */
  mol: number;
  /** Exponent for luminous intensity, in candelas */
  cd: number;
}

export function unit(exp: Partial<Unit>): Unit {
  return {
    s: exp.s ?? 0,
    m: exp.m ?? 0,
    kg: exp.kg ?? 0,
    A: exp.A ?? 0,
    K: exp.K ?? 0,
    mol: exp.mol ?? 0,
    cd: exp.cd ?? 0,
  };
}

export const unitless = unit({});

const canonicalOrder: Array<keyof Unit> = [
  "kg",
  "cd",
  "m",
  "s",
  "A",
  "K",
  "mol",
] as const;
export function stringifyUnit(a: Unit): string {
  const parts: string[] = [];

  for (let i = 0; i < canonicalOrder.length; i++) {
    const s: keyof Unit = canonicalOrder[i];
    const exp = a[s];
    if (exp === 0) {
      continue;
    }
    if (exp === 1) {
      parts.push(`${s}`);
    } else {
      parts.push(`${s}${exp}`);
    }
  }
  return parts.join(".");
}
