import { unit, Unit } from "./unit";

export const baseUnits = {
  s: unit({ s: 1 }),
  m: unit({ m: 1 }),
  K: unit({ K: 1 }),
  kg: unit({ kg: 1 }),
  cd: unit({ cd: 1 }),
  mol: unit({ mol: 1 }),
  A: unit({ A: 1 }),
} as const satisfies Record<string, Unit>;
