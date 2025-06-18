# Pending

# Done

- Line terminator (_i.e.,_ `;`) (optional, like Go?)
- Get rid of `begin`
- Change `model` to `component` and rename `ModelDefinition` to
  `ComponentDefinition` (approved by Chris)
- Add `external` (`internal`?) qualifier to `component` for non-Dyad models
- Change heredocs syntax to just line oriented comments (`# ...`, `// ...`?)
- Get rid of `equations`, `initial equations`, `transitions` and `connections`
  and replace with `relations` (approved by Chris)
- Allow equations like `initial v = 0` (not sure this is the final syntax, but
  AST should be stable at this point)

- Thoughts on metadata
  - Isolating metadata would make diffing quite hard
  - Much of the complexity of inline metadata can be masked by folding
  - No consistent cross-referencing scheme
  - Very prone to errors on rename
