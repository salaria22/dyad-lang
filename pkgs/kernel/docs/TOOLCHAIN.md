---
order: 80
icon: ":hammer_and_wrench:"
---

# Dyad Toolchain

The Dyad kernel can be used in a number of different ways. The kernel itself is just TypeScript and, therefore, it can run anywhere TypeScript runs. But there are several different types of workflows we'd like to support and this section discusses those in a bit of detail.

## In Browser Editing

The main use case for the Dyad kernel is in browser editing. Remember that Dyad is all about "compositional semantics". Previously, the composition of models relied on some kind of Julia process running in parallel with the GUI. The Dyad architecture is specifically about avoiding this.

The result is that the "center of gravity" of Dyad shifts from server-side Julia sessions to running natively in the browser. Not only that, the architecture supports having the working data in the browser as well (via the `LibraryProvider` interface). What this means is that the application starts up very quickly and doesn't rely on any external servers except to sync with `git` repositories or to run simulations. But the actual composition of models (both graphically and textually) is contained entirely within the browser.

The Dyad `Workspace` API is built on `rxjs` and is a responsive API. Unlike legacy compilers that run once, emit their artifacts and then exit, the Dyad `Workspace` is nominally a persistent, event driven system. Whenever there are changes to the "inputs" associated with the compilation process, it reacts by (re-)emitting the output artifacts.

## CLI Compiler

The CLI compiler is very similar to the in-browser system. It uses the same `Workspace` API to provide semantic analysis and code generation capabilities. There are three main differences.

- The first difference is in packaging. The `dyad-cli` repository contains the source code to the CLI compiler and `build` step in that repository creates a standalone executable (built using [`bun`](https://bun.sh/docs/bundler/executables)). This allows the CLI compiler to be distributed to non-browser contexts.
- The second difference is how files are stored. A browser itself cannot durably persist work. Yes, there is a storage API for the browser that allows it to store data but the size and longevity of this data cannot be counted on. The CLI version, however, assumes it is running on an operating system that provides _a true file system_. In this way, it can use the `fs` package from Node in order to both read Dyad source files and write code generated Julia code.
- Finally, the CLI compiler can function **both** as a single pass compiler (reading input Dyad files and writing generated Julia code and then exiting) or it can function in _watch_ mode where it runs persistently and triggers any time the input data has changed (much like how it runs in the browser).

## VS Code Extension

Another potential use case for Dyad is in VS Code. Specifially, it is straight forward to create a VS Code extension that provides a [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) (LSP) compatible server that provides information about Dyad files. This includes syntax highlighting, error reporting and semantic highlighting. Such an extension could also provide code completions and other LSP supported operations.
