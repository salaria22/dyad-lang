---
order: 105
icon: ":books:"
---

# Library Registries

Avik and I had a discussion today that I just wanted to make some permanent
notes about. We talked about the progress in understanding the format of
a Dyad component library and how it related to the structure of an ordinary
Julia package (see [here](./WORKFLOW.md#code-structure)). He said there were
still issues around dealing with packages. But these issues were not about how
they "bytes were written to disk" (that seems clear enough now), but rather how
these packages would be registered, searched and rendered.

## "Markers"

The first issue we discussed was related to identifying Dyad component
libraries. Although they are Julia packages, it would be useful to know
(without opening the package up and reading files and _definitely_ without
having to execute any Julia code) whether a given package was, in fact, a
Dyad component library.

Identifying such a file would depend on what he termed "markers". What those
markers are isn't immediately important, but it being able to note the presence
of such markers (again, without actually opening the package and reading any
files). I asked whether the Julia package manager supported "keywords" (_e.g.,_
like [`npm`
does](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#keywords)).
Apparently not. So what kind of "marker" should we use? I think that issue is
still with the platform team to figure out.

From my perspective, the ideal situation would be one where we could perform
searches against an index of Julia packages specifically filtering based on
Julia packages that contained Dyad components (without having to actually
open the package and look for the `dyad/` folder). But in addition, it would
potentially be useful to include information in the index about _what kinds_ of
components are available in the package registry (_e.g.,_ motors, fluid
properties, blocks, _etc._). So this is another open question. We discussed the
idea of using "tags" (like keywords in `npm`) and I think we agreed that would
be a reasonable route. That might make it easy to identify a Julia package with
Dyad components in it (_e.g.,_ based on the presence of a `dyad` tag). But
would using tags (_e.g.,_ `motors`, `fluid_properties`, `blocks` _etc._) be
sufficient to handle all the types of metadata we might want to include in a
search? Unclear.

Note that another complication that we didn't discuss was having different
distributions of a given component library taking into account IP concerns. The
normal way to publish these Dyad component libraries would be to effectively
publish the contents of the `git` repository. That would mean all Dyad code
(and all details contained in that code) along with all the generate Julia code
fully visible. But there is another case to consider. Specifically, Dyad
affords us the possibility to publish a version of the Dyad component library
that is reasonably obfuscated. In such a case, the Dyad source would
reference all models as `external` and all the code for creating components
would be written in Julia functions (which could potentially be lowered to
further obfuscate them).

One final topic that I mentioned during our discussion was the ability to
include metadata in a package that included **an icon**. This would be nice
when searching and selecting packages if there were a nice graphical cue in the
search results and not just straight text.

## Left Sidebar

Another issue that came up was how we manage what is visible in the "left
sidebar" which (across system simulation codes) is basically the space used to
catalog all the available components in the tool.

I can understand why there would be confusion about this so let me spell out
what I think would be the best way to organize the left side bar and I'll
discuss these _in the order they I think they should appear_ (from top to
bottom) in the left side bar:

- **Current Development Library**: This is the library the user is modifying.
  Although the Dyad `Workspace` class is capable of having multiple editable
  (_i.e,_ writeable) `LibraryProvider`s open at a time, I think it will be
  useful in order to avoid confusing on the user's part to have just a single
  library under active development.
- **Dependencies**: These are the Dyad component libraries that are _already_
  dependencies of user's current project. This means that they should be listed
  in the `Project.toml` file and that they should be part of the `Workspace`
  (_i.e.,_ each should have their own _read only_ `LibraryProvider` since they
  are not being actively developed _in this session_)
- **Potential Dependencies**: It should also be possible to add dependencies.
  I can see two ways of doing this. The first would be to have some dialog for
  adding dependencies that provides you with a list (ideally the result of
  searches like the ones described [in the previous
  section](#library-registries)). I think that would work nicely for
  third-party libraries (because there could potentially be a large number of
  either open source or enterprise packages that the user _might_ want to
  include and keeping them in some kind of search dialog/drop down keeps the
  interface from getting too "busy"). But for "first-party" libraries (_i.e.,_
  our content), we could consider having those specifically listed in the left
  sidebar. I would propose that they look a little bit different from the
  dependencies. They could, for example, but a list of libraries (with nice
  icons) but instead of being "openable" into a tree of components, they could
  simply feature a button that said "Add to this project". Clicking such a
  button would then add them to the dependencies (see previous bullet point).

Hopefully this clarifies some of the points around how to manage libraries,
search for libraries and manage libraries in the GUI.
