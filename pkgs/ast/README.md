# Dyad Language Abstract Syntax

## Installation and Use

This package can be installed with `npm install @juliacomputing/dyad-ast`.

The following command should install all dependencies and fully test this package:

```sh
$ npm install && npm run prepublish
```

## Overview

This package contains the data type used the represent the abstract syntax tree.
This information is meant to represent (only) the most essential information
found in the concrete syntax. This information should be sufficient for
performing all semantic analysis on the code and any code generation we wish to
perform as well.

The basic entities involved here are connector definitions, type definitions and
model definitions. All functions and other entitles with "imperative" semantics
are meant to be defined externally. Such external entitles (including
connectors, types and models defined in _other packages_) can be referenced via
a `using` statement.

## Unparsing

We expect humans to interact with the concrete syntax of the language while
machines will interact with the abstract syntax. Where this gets "tricky" is in
editing of the code. One could use a traditional text editor in which case
concrete syntax is all we would care about. But the entitles defined here have
**graphical** aspects as well. In fact, users may strongly prefer to edit these
entitles using a graphical perspective. In such cases, it is the _abstract
syntax_ that will be edited but ultimately it is the concrete syntax that will
be used as the single source of truth and which will also be version controlled.

So, how can we support a system where one user writes concrete syntax and then
another user graphically edits the same entities and then needs to commit those
changes back to a version control system in concrete syntax. This conversion
from CST -> AST -> CST ( -> AST -> CST) is called "round tripping". The
challenge isn't so much in the CST -> AST transition. Everything required by
the AST is present in the CST so this part is generally the easiest. The
problem is in the AST -> CST. Generally speaking, reconstituting the CST isn't
much of an issue either because putting back all the keywords and punctuation is
a completely deterministic process. The issue comes from certain cases of
"syntactic sugar" (_e.g.,_ multiple variables defined on the same line as is
allowed in Modelica) or from comments which are generally stripped by lexers
before any grammar is applied. Comments in particular are a problem because
they aren't even present in the concrete syntax.

We want to promote, as much as possible, the documentation of code but at the
same time avoid the hassles associated with comments. So the compromise that
has been settled on here is to provide (optional) documentation strings that
**are part of the grammar**. Because they are part of the grammar, they can be
easily reconstituted back into concrete syntax. But the tradeoff is,
documentation strings (or "doc strings" for short) **can only appear in
specific locations**. In other words, these are not freeform comments that can
be placed anywhere in the code. The are specifically "attached" to specific
grammatical entities.

It is now very common in language ecosystems for the tooling to provide
"formatting" of source code. We will take the same approach here. Furthermore,
users should _expect_ this formatting to take place automatically. In other
words, users will generally note be able to dictate the format/layout of their
source code. Instead, they will depend on tooling to do this formatting for
them (although potentially with some parameters they can tweak depending on their
preferences).
