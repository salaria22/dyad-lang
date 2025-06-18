---
order: 60
icon: hourglass-24
---

# Analysis

In addition to defining component models, Dyad also allows for the definition of
analyses. The creation of a new `analysis` is covered in the discussion of
[activites that occur across all modes](./OPENED.md#modes-of-operation).

To orient ourselves, let's view the various analysis related tasks in the
context of the open application and the other models of operation:

```mermaid
---
title: Analysis
---
flowchart LR
  classDef high fill:red,color:white;
  classDef med fill:orange;
  classDef low fill:#ffc;
  classDef done fill:#cfc;

  open[Dyad GUI Opened]

  all[All Modes]
  mod[Modeling]
  analysis[Analysis]
  test[Testing]
  viz[Visualization]
  admin[Administration]

  run[Running Analysis]
  launch["Launch Analyses (potentially more than 1)"]
  status[Progress of Current Running Analyses]
  cancel[Cancel a Running Analysis]

  view[Viewing Analysis Results]
  table[List Previous Analysis Results in Tabular Form]
  tree[List Previous Analysis Results in Tree Form]
  filter[Filter Analysis Results]

  style all color:#ccc
  style mod color:#ccc
  style test color:#ccc
  style viz color:#ccc
  style admin color:#ccc

  class launch done
  class status,run,analysis high
  class cancel,table,tree,filter,view med

  open --> all
  open --> mod
  open --> analysis
  open --> test
  open --> viz
  open --> admin

  analysis --> run
  run --> launch
  run --> status
  run --> cancel

  analysis --> view
  view --> table
  view --> tree
  view --> filter
```
