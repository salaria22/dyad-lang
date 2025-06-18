# Dyad Language

This repository contains several different TypeScript packages that, together,
implement the various aspects of the Dyad language toolchain.

This monorepo is composed of the following directories and explains what package
is contained in that directory and what its function is:

- `pkgs`: contains packages, not applications
  - `common`: Contains `@juliacomputing/dyad-common`, a collection of
    utility types and functions used across the Dyad language toolchain.
  - `ast`: Contains `@juliacomputing/dyad-ast`, a package that contains type for
    representing all the differnet node types found in the Abstract Syntax Tree
    (AST) of Dyad code.
  - `parser`: Contains `@juliacomputing/dyad-parser`, a package that provides
    functions to parse Dyad code into an AST _and_ unparse an AST back into Dyad
    code.
  - `kernel`: Contains `@juliacomputing/dyad-kernel`, a package that provides
    semantic analysis, file handling and code generation for Dyad libraries.
- `apps`: contains complete tools/applications that depend on the packages above
  - `cli`: Contains `@juliacomputing/dyad-cli`, a command line tool for
    compiling Dyad code into Julia
  - `studio`: Contains `@juliacomputing/dyad-studio`, the source code for
    Dyad Studio, a Visual Studio Code extension that supports development of
    Dyad code.

## Getting Started

### Installation

Once this repository is checked out, you simply need to run `npm i` to install
all required dependencies. If you plan to build the VS Code extension, you
currently need to install the graphical "details view" dependencies separate by
running `(cd apps/studio/details-webview; npm i --workspaces=false)`. This is
temporary until we can pull this out as its own workspace.

You don't technically need to install `turbo` globally, but it is convenient.
But if you just want to "kick the tires" quickly perform a task on a machine
without a host of dev tools on it, you can always run `npx turbo ...` and it
will use the repo local version of `turbo`.

### Builds

To build, simply run `turbo run build`. If you run this at the root level, it
will run everything. If you run it within a given package, it will only build
those things that are dependencies of the current package.

### Testing

To test, simply run `turbo run test`. Same caveats about location apply as with `build`.

### Release Process

Set the version of all packages to the desired version.  Do this by running:

```
$ npm version -ws <version number>
$ npm run reset
$ npm run test
$ npm run package
$ npm run publish
```

Obviously, you need to ensure that `<version number>` is "newer", in the semantic version sense, than the previous version.

We attempt to build the `kernel` first since it will run `test:release`.  If that fails, then _nothing_ will get published.
