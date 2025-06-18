# Overview

This repository contains the Dyad kernel. This is where the semantics of the
language live and also the reactive model of the underlying Dyad workspace.

## Installation and Use

You can install this package with `npm install @juliacomputing/dyad-kernel`.
The dependencies should be such that it can be bundled for use in a browser
(_i.e.,_ no hard dependencies on `node` packages).

To do a complete build and test of the package, run:

```sh
$ npm install
```

## Dependencies

This package depends on the follow other `@juliacomputing` NPM packages:

- [`dyad-common`](./pkgs/common): Useful
  types and functions shared across Dyad packages.
- [`dyad-ast`](./pkgs/ast): Definition of
  the Dyad abstract syntax
- [`dyad-parser`](./pkgs/parser):
  Package with functions to parse Dyad concrete syntax and convert it into a
  Dyad abstract syntax tree

## Dependents

The following packages depend on this package:

- [`dyad-cli`](./apps/cli)
- [`dyad-studio`](./apps/studio)
