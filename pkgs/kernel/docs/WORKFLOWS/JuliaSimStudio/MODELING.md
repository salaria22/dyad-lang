---
order: 70
icon: home-24
---

# Modeling

Because the primary purpose of Dyad Studio is to create and edit component
models, this section must also be subdivided into different sections. Recall
that there are different "layers" to a given Dyad component definition.
Specifically, these are conventionally the "icon", "diagram", "documentation"
and "text" layer. For this reason, we will divide the discussion of modeling
related tasks by layer (with an additional section for tasks that should be
possible in every layer).

The following is an overview and each subsequent section refines the view with
additional details:

```mermaid
---
title: Modeling
---
flowchart LR
  open[Dyad Code Activated]

  all[All Modes]
  mod[Modeling]
  analysis[Analysis]
  test[Testing]
  viz[Visualization]
  admin[Administration]

  style all color:#ccc
  style analysis color:#ccc
  style test color:#ccc
  style viz color:#ccc
  style admin color:#ccc

  icon[Icon Layer]
  doc[Documentation Layer]
  source[Source Code Layer]
  diag[Diagram Layer]

  open --> all
  open --> mod
  open --> analysis
  open --> test
  open --> viz
  open --> admin
  mod --> icon
  mod --> doc
  mod --> source
  mod --> diag
```

## Icon Layer

The following figure shows tasks the user might perform that are related to the
icon associated with a given component

```mermaid
---
title: Modeling - Icon Layer
---
flowchart LR
  open[Dyad Code Activated]

  mod[Modeling]

  icon[Icon Layer]
  doc[Documentation Layer]
  source[Source Code Layer]
  diag[Diagram Layer]

  view[View Icon]
  add[Add Icon Image]
  change[Change Icon Image]
  addt[Add Text Label]
  editt[Edit Text Label]
  delt[Delete Text Label]

  style doc color:#ccc
  style diag color:#ccc
  style source color:#ccc

  open --> mod
  mod --> icon
  mod --> diag
  mod --> doc
  mod --> source

  icon --> view
  icon --> add
  icon --> change
  icon --> addt
  icon --> editt
  icon --> delt
```

## Documentation Layer

A user may wish to view and/or edit the documentation associated with a Dyad
model. This figure lists the type of documentation the user should see and
could edit.

```mermaid
---
title: Modeling - Documentation Layer
---
flowchart LR
  open[Dyad Code Activated]

  mod[Modeling]

  icon[Icon Layer]
  doc[Documentation Layer]
  source[Source Code Layer]
  diag[Diagram Layer]

  cdoc[Component Doc String]
  pdoc[Parameter Doc Strings]

  style icon color:#ccc
  style diag color:#ccc
  style source color:#ccc

  open --> mod
  mod --> icon
  mod --> doc
  mod --> source
  mod --> diag

  doc --> cdoc
  doc --> pdoc
```

## Source Code Layer

When viewing the "raw" Dyad code, the user should have the possibility to edit
the code. This section doesn't enumerate the tasks because the user could do
literally anything to the code in this state. **However**, one thing to keep in
mind is that once the user is finished editing the code, the resulting text may
contain syntax errors. In terms of the Dyad AST, this would change the node
from a [`ParsedFile`](https://cautious-broccoli-8q238o4.pages.github.io/interfaces/ParsedFile.html) to a [`RawFile`](https://cautious-broccoli-8q238o4.pages.github.io/interfaces/RawFile.html) node.

```mermaid
---
title: Modeling - Source Layer
---
flowchart LR
  open[Dyad Code Activated]

  mod[Modeling]

  icon[Icon Layer]
  doc[Documentation Layer]
  source[Source Code Layer]
  diag[Diagram Layer]

  style icon color:#ccc
  style diag color:#ccc
  style doc color:#ccc

  open --> mod
  mod --> icon
  mod --> doc
  mod --> source
  mod --> diag
```

## Diagram Layer

```mermaid
---
title: Modeling - Diagram Layer
---
flowchart LR
  mod[Modeling]

  icon[Icon Layer]
  doc[Documentation Layer]
  source[Source Code Layer]
  diag[Diagram Layer]

  style icon color:#ccc
  style source color:#ccc
  style doc color:#ccc

  def[Current Definition]
  rename[Rename Definition]
  addp[Add Parameter]
  editp[Edit Parameter]
  propp[Propagate Parameter]

  sub[Subcomponents]
  places["Place Subcomponent (Drag and Drop)"]
  moves[Move Subcomponent]
  dels["Delete Subcomponent"]
  copys["Copy Subcomponent(s) "]
  pastes["Paste Subcomponent(s)"]
  renames["Rename Subcomponent"]
  edits["Edit Subcomponent Parameter Values"]
  mapp[Map Parameters from External Source]
  groups["Group Subcomponents -> New Component"]

  state[State Machines]
  addtr[Add Transition]
  deltr[Delete Transition]
  edittr[Edit Transition]

  con[Connectors]
  addc["Add New Connector (Drag and Drop)"]
  delc["Delete Connector"]
  renamec["Rename Connector"]

  cnx[Connections]
  addcx[Make Connection]
  movecx[Move Connection]
  delcx[Delete Connection]

  label[Text Labels]
  addt[Add Text Label]
  editt[Edit Text Label]
  delt[Delete Text Label]

  mod --> icon
  mod --> doc
  mod --> source
  mod --> diag

  diag --> def
  diag --> sub
  diag --> con
  diag --> cnx
  diag --> state
  diag --> label

  def --> rename
  def --> addp
  def --> editp
  def --> propp

  sub --> places
  sub --> dels
  sub --> moves
  sub --> renames
  sub --> edits
  sub --> mapp
  sub --> copys
  sub --> pastes
  sub --> groups

  con --> addc
  con --> delc
  con --> renamec

  cnx --> addcx
  cnx --> movecx
  cnx --> delcx

  state --> addtr
  state --> edittr
  state --> deltr

  label --> addt
  label --> editt
  label --> delt
```
