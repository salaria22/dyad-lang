import { Unit } from "./unit";

export function multUnit(a: Unit, b: Unit): Unit {
  return {
    s: a.s + b.s,
    m: a.m + b.m,
    kg: a.kg + b.kg,
    A: a.A + b.A,
    K: a.K + b.K,
    mol: a.mol + b.mol,
    cd: a.cd + b.cd,
  };
}

export function divUnit(a: Unit, b: Unit): Unit {
  return {
    s: a.s - b.s,
    m: a.m - b.m,
    kg: a.kg - b.kg,
    A: a.A - b.A,
    K: a.K - b.K,
    mol: a.mol - b.mol,
    cd: a.cd - b.cd,
  };
}
