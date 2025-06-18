---
icon: ":repeat:"
---

# Workflows

## Enumerated Workflows

Before trying to flowchart the use of the tool, let's just point out these are
some of the use cases we want to contain:

1. Component Library Creation
2. System Model Creation
3. System Analysis
4. Turn Key Application Creation
5. Embedded System Development

## Terminology

- `Julia package` - A Julia package that **does not** contain any Dyad definitions
- `Dyad library- - A Julia package that **does** contain Dyad definitions
  (_i.e.,_ this term is used to easy distinguish between a pure Julia package
  and a Julia package that contains Dyad definitions)
- `project` - A project is a `git` repository that contains a Dyad library.
- `dependency` - A dependency can be either a Julia package or a Dyad library

**NB** - The difference between the project and the dependencies that are Dyad
libraries is **only** the fact that one is read/write (the project) and the
others are read-only. In terms of the GUI, there is not other distinction to be
made between them. All of them are Dyad libraries.

## GUI User Interactions

[This document](./GUI/README.md) will walk through details of how the user
interacts with the Dyad GUI. This starts with a discussion of application
startup and then goes into greater detail about the various types of
interactions.

## Dyad Studio User Interactions

[This document](./Studio/README.md) will walk through details of how the
user interacts with Dyad Studio. This starts with a discussion of how the
user would launch Dyad Studio via VS Code and then goes into greater detail
about the various types of interactions.
