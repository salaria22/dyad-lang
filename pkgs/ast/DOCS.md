# Dyad Abstract Syntax Tree

This library is used to capture the types associated with the Dyad abstract
syntax.

The functionality in this library can be grouped by the following categories:

## AST Nodes

Abstract syntax nodes can be recognized by the `"kind"` field. Because `ASTNode`
type is the union of all abstract syntax node types and each of these node types
(_e.g._, `WorkspaceNode`) not only have a `"kind"` field but each has a mutually
exclusive possible (string) value, we can use the `"kind"` field to distinguish
one node type from another. Furthermore, by simply checking the particular value
for `"kind"`, the TypeScript compiler will automatically narrow the type of the
node we are dealing with. This is why [type predicates](#type-predicates) are so
useful.

## Expression Nodes

These are abstract syntax tree nodes, but ones that are a special subset that
are used exclusively in the representation of mathematical expressions. As
such, they are all specializations of the `Expression` type.

## Navigation

In order to facilitate walking of the abstract syntax tree, it is necessary for
each node type (that actually has child nodes) to provide a function that lists
out each of its child nodes.

In additions, there are a few other functions provided related to navigation of
the abstract syntax tree.

## Spans

In addition to the `"kind"` field, many of the node types, many of the nodes
feature one or more instances of the `Span` data type. This type is used to
capture the extend of a textual region. A span is basically the start and end
of a sequence of lexical tokens. For example, a construct like:

```
# A linear resistor model
component Resistor
  extends TwoPin
relations
  v = i*R
end
```

The `span` field for this
`ComponentDefinition` would correspond to the
position within the source file starting with the doc string and finishing with
the last character in the `end` token that terminates the definition.

## Problems

This library defines a special `TextProblem` type which is a subtype of
`Problem` but provides details on where, in a given file, the problem is
located. This is then used, downstream by the Dyad Studio extension, to
highlight the problem in the context of an open Dyad file.

## Type Predicates

Type predicates are used to determine if a particular type of data is actually a
value of a narrower type. TypeScript uses this type predicates to narrow the
type in a given context. These generally (but not always) function by keying
off of the value of the `"kind"` field.

## Structured Data

There are several types defined here that are `interface` definitions but are
not _themselves_ AST nodes. Instead, they are structured data associated with
AST nodes.

## Keys

The `FileKey` type is used to reference Dyad source files and asset files
(_only_).

## Constants

There are a few `const` variables defined in this package that are exported for
use in other packages.
