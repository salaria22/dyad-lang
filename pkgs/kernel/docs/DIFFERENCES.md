---
order: 30
icon: ":left_right_arrow:"
---

# Dyad Differences

## Dyad vs. Modelica

- Modelica has no (official) package manager or package repository. As a
  result, the Modelica Standard Library is large and bloated.
- Modelica has functions, Dyad does not. Any imperative semantics/behavior
  required in Dyad must come from Julia functions. Said another way, Dyad
  has a "foreign function" interface and that is linked (exclusively) to Julia
  functions (which can, in turn, call any number of other languages).
- No separate `initial equation` section. Instead, we have a `relations` section
  which includes expressions of equations (initial and otherwise), connections
  and transitions.
- Dyad literals allow scientific prefixes.
- Dyad allows connecting multiple components in a single connect statement.
