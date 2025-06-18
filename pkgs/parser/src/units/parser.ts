import { baseUnits } from "./base";
import { derivedUnits } from "./derived";
import { divUnit, multUnit } from "./ops";
import { unit, Unit } from "./unit";

/**
 * List of all base and derived units (both name and representation of the
 * unit)
 **/
export const unitTokens = [
  ...Object.entries(derivedUnits),
  ...Object.entries(baseUnits),
];

/**
 * Sort the components longest to shortest.  This is how we implement "greedy"
 * semantics when attempting a match.
 **/
unitTokens.sort((a, b) => b[0].length - a[0].length);

/**
 * This function parses a string `s` into a `Unit` representation
 *
 * This function works by processing each unit segment left to right.  The only
 * real "syntax" here.  It is simply a matter of "chopping" up a string wherever
 * we find a `.` or `/`.  The default is that we are multiply the unit
 * representation of each chunk by each the next chunk _unless_ they are
 * separated by a `/` in which case we divide by (only) the chunk that
 * immediately follows the `/`.
 *
 * As an example, consider the following:
 *
 * kg.m/s
 *
 * We process this as:
 *
 * 1.kg.m/s
 *
 * So we start with a unitless quantity and multiply it by `kg`.  Then we
 * multiple by `m` and then we divide by `s`.  In effect, this is a map/reduce
 * like operation.
 *
 * This parser also handles parentheses.
 *
 * @param s String representation of unit
 * @returns `Unit` representation
 */
export function parseUnits(s: string): Unit {
  // Initial assume we are multiplying (because there is no `/` preceding this
  // string, instead we assume something like `1.` to precede `s`).
  let div = false;
  // We start with the "unitary" unit which is just `1`.  This will be a form
  // of "accumulator" value.
  let cur = unit({});
  // The remainder of the string to process **is** the string
  let rest = s;

  // As long as there are more units to process...
  while (rest !== "") {
    // Check if this is a sub-expression enclosed in (...)
    if (rest.startsWith("(")) {
      const close = rest.indexOf(")");
      if (close === -1) {
        throw new Error(`Unmatched parentheses in ${rest}`);
      }
      // Parse the subexpression as a unit expression by itself
      const cunit = parseUnits(rest.slice(1, close));
      // and then either multiply our "current" unit by the result.
      cur = div ? divUnit(cur, cunit) : multUnit(cur, cunit);
      rest = rest.slice(close + 1);
      if (rest !== "") {
        div = rest[0] === "/";
        rest = rest.slice(1);
      }
    } else {
      // If we get here, this is not a sub-expression so that means one of two
      // possibilities.  The first is that the rest of the string is _just_ a
      // unit (potentially raised to a power) OR it is a unit expression.

      // Find the next `.` or `/`
      const next = nextOp(rest);
      if (next === -1) {
        // If there isn't an operator, just parse the rest of the string and
        // apply it based on context (`div` or not) and then empty `rest.
        const cunit = parseTerm(rest);
        cur = div ? divUnit(cur, cunit) : multUnit(cur, cunit);
        rest = "";
      } else {
        // Here we have an expression so we isolate the next pure unit in
        // `chunk`.
        const chunk = rest.slice(0, next);
        // Get the unit for this chunk
        const cunit = parseTerm(chunk);
        // Perform our reduce operation based on context (`div` or not)
        cur = div ? divUnit(cur, cunit) : multUnit(cur, cunit);
        // Determine the context (`div` or not) for the _next_ term
        div = rest[next] === "/";
        // Isolate the remaining terms of the string.
        rest = rest.slice(next + 1);
      }
    }
  }
  return cur;
}

/**
 * This is like `indexOf` but looking for two possible strings and returning the
 * index of the one that occurs first.
 */
function nextOp(s: string): number {
  // Get the indices for the next division or multiplication
  const div = s.indexOf("/");
  const mult = s.indexOf(".");

  // If neither appear, then return -1
  if (div === -1 && mult === -1) {
    return -1;
  }

  // If division isn't there, return the index of `.`
  if (div === -1) {
    return mult;
  }

  // If multiplication isn't there, return the index of `/`
  if (mult === -1) {
    return div;
  }

  // If both are non-zero, return the first one.
  return Math.min(mult, div);
}

/**
 * This parses a "term" in a unit expression.  A term includes just a unit
 * string (keys in `derivedUnits` or `baseUnits`, _e.g._, `m`, `N`, `W`) but it
 * can also include an "exponent" (as a number).  If no exponent is included
 * then it is implicitly `1`.
 *
 * @param term Unit expression term
 * @returns Unit representation for the term
 */
function parseTerm(term: string): Unit {
  if (term === "1") {
    return unit({});
  }
  // Iterate over all possible non-exponetiated terms
  for (const [token, tunit] of unitTokens) {
    // If the token exactly matches what was passed in, then just return the
    // `Unit` representation for it.
    if (term === token) {
      return tunit;
    }

    // If we get here, the term presumably includes an exponent as well.  So
    // first we need to determine the exponent...
    if (term.startsWith(token)) {
      const rest = term.slice(token.length);
      try {
        const exponent = parseInt(rest);
        // If we get here, we got a valid integer exponent.  Now we perform the
        // exponentiation by repeated multiplication.
        let ret = unit({});
        for (let j = 0; j < exponent; j++) {
          ret = multUnit(ret, tunit);
        }
        return ret;
      } catch {
        throw new Error(`Invalid power '${rest} applied to unit ${token}`);
      }
    }
  }
  throw new Error(`Unrecognized unit at start of '${term}'`);
}
