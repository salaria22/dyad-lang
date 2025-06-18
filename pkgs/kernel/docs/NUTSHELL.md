---
order: 95
icon: ":peanuts:"
---

# Dyad in a Nutshell

Before going on a deep dive into the implementation of the Dyad toolchain,
let's just take a moment to summarize the basic idea behind Dyad. We've
already discussed the [goals](./WHY.md). So let's spend a little bit of time on
the how.

## Language Kernel

The [`dyad-kernel`](https://github.com/JuliaComputing/dyad-kernel) repository
is a kind of nexus for all Dyad related functionality. We refer to the
`dyad-kernel` package as the "Dyad kernel" because it implements the
language semantics, the implementation of a Dyad `Workspace` and a variety of
code generation related functions.

The language kernel follows a few important principles:

- **The Dyad code is the "single source of truth"**: Everything from the
  mathematical behaviors, the definitions of connectors, the graphical
  representations, test cases...are all represented in the Dyad code. The
  only exception to this rule is **functions**. These are implemented in pure
  Julia and referenced from Dyad. In this way, there is a clear delineation
  between the declarative semantics and the imperative semantics.
- **The Dyad code can be "projected" or "viewed" in many different ways**: So,
  for example, we might want to view a diagram of a Dyad model as an SVG
  file? Or, we might want to see the expressions that describe the mathematical
  behavior of the model? Or, we might want to understand the data that goes
  into or out of the model or the ways that one might connect to a model. All
  of these are different _facets_ of the model...but the Dyad source is the
  _whole_ model.
- **Julia Code is one facet**: One important facet of the Dyad code is the
  Julia code that can be generated from the Dyad code. There is a
  fundamental assumption in the code generation process that the ultimate goal
  is to generate **a Julia package** so as to make the ModelingToolkit
  components into reusable Julia packages that can be used as dependencies in
  other model development activities. Package management is essential in
  creating a system that scales well.
- **Reuse, don't reinvent**: The metadata and graphical representations in
  Dyad leverage both the JSON object model, the SVG standard for vector
  graphics and the JSON Schema standard. The point here is that all these
  technologies are ubiquitous, well designed and well supported and we don't
  want to spend any resources creating our own, niche flavor of any of them.
- **Assets**: As part of our "reuse" of SVG, we need to import baseline SVG data
  and reference it from within our Dyad models. We may also want to
  reference other information like data. For this reason, Dyad defines a
  `dyad` URL scheme to reference such package local assets.

## Upstream Dependencies

This language kernel itself depends on two main upstream packages. The first is
the `dyad-ast` package which defines the Abstract Syntax Tree (AST)
representation of Dyad code. In addition, the kernel also depends on the
`dyad-parser` package which is responsible for parsing the _concrete_ Dyad
syntax and transforming it into the AST representation described in
`dyad-ast`.

At first, it may seem like these two packages are so strongly related that they
should be a single package. But, in fact, they are quite loosely coupled. The
reason is that the Dyad AST is precisely as its name suggest..._abstract_.
In fact the `dyad-ast` package acts as a kind of buffer between the language
kernel and the concrete syntax. Said another way, the `dyad-kernel` neither
knows nor cares at all about the concrete syntax and this is by design. It
preserves the flexibility to make changes to the concrete syntax (_e.g._ to
improve readability) without having to updated any of the semantic processing
code.

In addition to note being aware of the Dyad concrete syntax, the language
kernel also knows nothing about how the language is parsed. This provides the
additional flexibility that we could also (re-)implement the parser any time we want
without impacting the language kernel.

Finally, this also means that there is no "cognitive load" imposed on the
developers working with the language kernel to have to think or reason in terms
of the concrete syntax. Instead, they can simply concern themselves exclusively
with the abstract syntax which is much more amenable to programmatic use and
manipulation.

## Downstream Dependencies

The language kernel is itself an upstream dependency of both the Dyad CLI tool
as well as Dyad Studio.

The CLI tool can either be used as a "one pass" compiler or it can be placed in
"watch" mode in which case it will continuously check for modifications to the
file system and re-run the Julia code generation process as needed. It is
designed to be completely cross platform, to "play nicely" with `Revise` and to
be bundled as a single executable via `bun`.

The VS Code extension is mostly a proof of concept at this point but it has
demonstrated the ability to bundle the Dyad language kernel into a [Language
Server Protocol](https://microsoft.github.io/language-server-protocol/) (LSP)
compatible service. While there is great room for many improvements, the basic
capabilities like flagging compilation errors should largely mirror capabilities
already in the Dyad kernel.
