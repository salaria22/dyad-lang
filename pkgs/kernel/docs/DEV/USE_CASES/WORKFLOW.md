---
order: 110
icon: ":mountain:"
---

# Workflow Overview

The goal of this section is to provide explanations of how the Dyad
architecture would be used in several different contexts. Hopefully this will
give developers a better understanding of how users of Dyad and Dyad will
create and manage components

Before we get into the other details, let's start by just explaining how Dyad
code is organized since this is relevant to nearly every topic to be discussed.

## Code Structure

At the end of the day, Dyad code is used to generate Julia code and that
Julia code is organized into Julia packages (so that we can leverage the Julia
package manager and Julia module system).

Recall that a Julia package generally has the following directories:

- `src/` - stores the entry point for the Julia package
- `test/` - stores the `runtests.jl` file used by the package manager.

Dyad source material (code and assets) is stored in two additional
directories **right along side** the `src/` and `test/` directories:

- `dyad/` - where Dyad source code is stored. **Any subdirectory in here
  represents another module**
- `assets/` - where version controllable assets are stored (these can be
  referenced from within Dyad using the `dyad://` URL scheme, FYI)

In addition, soon generated Dyad code will be placed in:

- `generated/` - so that all generated code is partitioned off from other
  non-generated code to avoid any confusion

Finally, like any Julia package, there should be a `Project.toml` file as well
that names the package, includes the version number, authors, UUID, _etc._. So,
in summary, if you look into the `git` repository associated with the Dyad
`Electrical` library, you would see:

```
.
├── Project.toml
├── src
│   └── Electrical.jl (with `include("../generated/Electrical_components.jl")`)
├── test
│   └── runtests.jl (with `include("../generated/Electrical_tests.jl")`)
├── dyad
│   ├── types.dyad
│   ├── ...
│   ├── resistor.dyad
│   └── Examples (this is a submodule)
│       ├── low_pass_filter.dyad
│       └── rlc_model.dyad
├── assets
│   ├── PositivePin.svg
│   ├── ...
│   └── ResistorIcon.svg
└── generated
    ├── Electrical_components.jl
    └── Electrical_tests.jl
```

The bottom line is that the `Project.toml`, `src/` and `test/` are all
"standard" Julia directories. The `dyad/` and `assets` directories are for
Dyad source material and, finally, `generated/` is where the Dyad compiler
stores the output (Julia) code.

A good example of this code structure can be found in the
[`Electrical.jl`](https://github.com/JuliaComputing/Electrical.jl) repository.

## GUI

From within the Dyad GUI, users will almost entirely focus on creating
schematics via drag and drop. Although Dyad is used as the "single source of
truth" underneath, that does not _necessarily_ need to be exposed to the users
of the GUI.

Ultimately, Dyad code is managed by `LibraryProvider`s. For example, the
Dyad Playground has one implementation of the `LibraryProvider` interface
that reads/writes files from `git`. Another implementation can read (but not
write) Dyad source from Zip files. The `LibraryProvider` interface is quite
generic so it can be mapped to nearly anything that could be construed as a file
system.

Users are ultimately using the graphical user interface to create components.
**All such components are stored in component libraries**. In other words, it
isn't just that the users are dragging and dropping components from component
libraries to use, they are dragging and dropping those components **into**
components that are _also_ stored in component libraries. So everything that is
happening in the GUI involves reading and writing to `LibraryProvider` instances
and these `LibraryProvider` instances are simply providing access to files
described in the [Code Structure](#code-structure) section.

Typical things that people would do in the GUI would be:

### Create a New Component Library

They would do this to initiate new work (_e.g.,_ modeling a particular product).
Since this is new work, it ultimately means instantiating the [Code
Structure](#code-structure) previously described. But this can be done via the
`LibraryProvider` interface which abstracts away the file system. This may also
require creating a `git` repository and initializing the code structure.

Generally, it should be simple enough for the user to choose some "Create
Modeling Library" option and then have them be prompted for any detailed
required in order to create the necessary infrastructure (_e.g.,_ `git`
repository). Once that infrastructure is in place, then they have everything
they need to read/write the underlying Dyad source and even a place to put
the generated Julia code.

### Create New Definitions

Within a component library, the user will need to store definitions of
`connector`s, `component`s and `type`s. So they will need a means, via the GUI,
to create such things. Creating a `connector` or `type` can be ignored for now
(since you'd generally do that directly in the textual representation, see [VS
Code](#vs-code)) and we can probably ignore this use case for now (also because
hopefully all the types and connectors they would need will largely already
exist).

So the focus here should be on creating new component definitions in their
component library. This will largely involve creating the new component
definition and then dragging and dropping existing components into the diagram
layer of their new component. Obviously, they'll need a way to save these
component definitions and eventually to be able to rename these definitions and
reorganize the contents of the library they belong to.

### Creating Component Instances

The "instance" is the thing that exists in the diagram layer. It is important
to understand that the definition of the `Resistor` component is defined once
(_e.g.,_ in the `Electrical` library) and then **never modified**. That
`Resistor` definition is like a C++ class and each instance of that `Resistor`
is like an instance of the C++ class. This means we can change the _data_
associated with each `Resistor` instance, but we cannot change the definition of
the `Resistor` (_i.e.,_ which equations, parameters, variables or connectors are
contained in the `Resistor`). All we can change in the instance are values
(_e.g.,_ parameter values).

## VS Code

Users choosing to use VS Code will edit code much like they would normal Julia
code. Going the VS Code route will give them access to writing their own Julia
functions which will prove essential in creating their own "atomic" component
definitions (_i.e.,_ definitions that are not built by drag and drop graphical
construction but rather written strictly in terms of textual equations).

When using VS Code, users would generally benefit from using the [Dyad
CLI](https://github.com/JuliaComputing/dyad-cli) which can be used not only
to create a new Dyad library (using `dyad create ...`) but also to compile
the Dyad code contained in the repository into Julia code (see [Code
Structure](#code-structure)) via the `dyad compile ...` command.
Furthermore, by adding the `--watch` (or `-w`) flag, the compiler will run
continuously and regenerate the Julia code whenever the Dyad code is updated.

Another way that users might choose to generate Julia source would be via a
Dyad VS Code _extension_. Although there is an initial extension available,
it is quite out of date with the code base at this point. It would not take
much effort to bring it up to date, but it isn't clear that this will be a
priority for some time. But with such an extension in place, automatic
recompilation of the Dyad code could be supported just as it is in the CLI.

One tricky aspect of all this is ensuring that Dyad libraries can be modified
**both** by textual manipulation (_e.g.,_ via VS Code) and via the GUI. In
other words, we cannot assume that a given library is developed exclusively
using one toolchain or the other. This is why the "single source of truth"
concept is so important. They both ultimately need to read and manipulate the
Dyad source code so there should be no real conflict created by using
different toolchains.

## Version Control

Generally, Dyad developers will want to version control all the files in all
of the directories described [here](#code-structure). One might argue that it
isn't necessary to version control the generate Julia source code since this is
a compilation artifact. This is true and developers can choose to add such
files to their `.gitignore` files. However, there are two points to consider
here. First, the generate code is still source code (_i.e.,_ these are not
large binary artifacts like `.o` or `.a` files). So they are still handled
reasonably well by `git`. Second, if you do not include the generate Julia code
in the repository, you transfer the burden of (re-)generating the Julia code to
any other users of the library. This means they will have to install the
necessary Dyad tool chain in order to (re-)generate the Julia code which
might be somewhat tedious.

## Code Generation

As mentioned [previously](#code-structure), the generated Julia code will soon
be stored in a dedicated folder separate from any user written code. The
current compiler toolchain still has some rough edges so there are potential
issues lurking there where the compiler will fail to generate some code (due to
upstream Dyad source errors). Ideally, the toolchain will be refined so that
it only generates source code in the case where there are no upstream issues.

## Publishing

Since these are "just" Julia packages, publishing the generated Julia code is
really just as simple as publishing any other Julia package. But there are two
important cases to consider.

The first case is one where there are no concerns around the intellectual
property represented by the Dyad source. If you don't care that other people
can see the Dyad source code (or the generated Julia code) (_e.g.,_ because
it is an open source library or because it will only be shared with people
within your organization), then you really can just publish the Julia package
"as usual".

But if you are concerned about the intellectual property contained in the
library, a second mode of publishing may be required. In this mode, all Dyad
source should be transformed into an "interface only" version. In such a case,
the Dyad source is rewritten so that only the "public" connectors and
parameters of a component are visible and the rest of the component is marked as
`external` (this is an existing keyword in Dyad that indicates that the
construction of the system of equations is done by an external Julia function
and not using the `relations` section of a Dyad definition).

In addition to transforming the Dyad source into an "interface only"
representation a similar process may be needed on the Julia source code side.
If the Julia source can be lowered into some kind of precompiled form (that can
still be called, by the same name, from Julia), then you can achieve a level of
obfuscation that may allow the code to be shared without exposing and
proprietary IP. The dyad toolchain could quite easy support the Dyad
transformation. With this approach, you would likely want to "export" this
obfuscated version of the Julia package (it would still be a Julia package, just
like the original, just with far less exposed information). Then this exported,
obfuscated Julia package could then be published to registries and used by
others.

## Dependencies

Finally, Dyad developers (especially GUI users) will need to leverage other
existing components (presumably published via the mechanisms described
[here](#publishing)). It is important to understand that the Dyad GUI is
built around the assumption that **all component models** are expressed in
Dyad. Ideally, the entire component definition would be written in Dyad
(down to the equations) but, as mentioned [previously](#publishing), an
"interface only" representation of a Dyad component definition is sufficient
both for `using` the component in other Dyad projects and it also provides
sufficient information for the Dyad GUI to allow that component to be
dragged into a schematic.

But in each project, the user should declare what other Dyad libraries they
wish to drag components from. All this is managed by the `Project.toml` file
(since these are all, at the end of the day, just Julia packages depending on
other Julia packages). Just to be very clear, the "single source of truth"
about what external Julia packages (Dyad libraries + any other Julia packages
that are needed) is the `Project.toml` file. Stated another way, we _do not
infer_ dependencies from `using` statements in Dyad.

When using the Dyad GUI, the "left side panel" should be populated with
components from these other Dyad component libraries (_i.e.,_ the
dependencies). How that left side panel should be "organized" is a separate
topic beyond the scope of this specific document (see
[here](../GUI_POKE/ELECTRICAL.md), for example). But in any case, the
dependencies represent the set of available components for the user to "draw
upon" when building their own components.
