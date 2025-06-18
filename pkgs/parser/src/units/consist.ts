import { stringifyUnit, Unit } from "./unit";

/**
 * Check for consistency of two different units.  This function returns null if
 * the units are consistent, otherwise it returns a string describing the
 * difference in units.
 *
 * @param lhs Units of left hand side
 * @param rhs Units of right hand side
 */
export function checkConsistency(lhs: Unit, rhs: Unit): string | null {
  if (
    lhs.s === rhs.s &&
    lhs.A === rhs.A &&
    lhs.K === rhs.K &&
    lhs.cd === rhs.cd &&
    lhs.kg === rhs.kg &&
    lhs.m === rhs.m &&
    lhs.mol === rhs.mol
  ) {
    return null;
  }
  return `Unit ${stringifyUnit(lhs)} does not match unit ${stringifyUnit(rhs)}`;
}
