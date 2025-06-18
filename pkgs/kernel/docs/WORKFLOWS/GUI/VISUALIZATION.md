---
order: 40
icon: image-24
---

# Visualization

Once we have built our models, tested them and performed some analyses with
them, we'll ultimately want to visualize the results of these analyses. This
section describes the various interactions the user is likely to have with the
application in order to render those visualizations.

```mermaid
---
title: Visualization
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

  selecta[Select Analysis/Analyses]
  selectr[Select Results from Specific Analysis]
  pick[Pick Predefined Plots and Reports]
  plot["Pick Signals to Plot (from across multiple results)"]
  param["Pick Signals to Plot Parametrically (from across multiple results)"]

  style all color:#ccc
  style mod color:#ccc
  style analysis color:#ccc
  style test color:#ccc
  style admin color:#ccc

  class selecta,selectr,pick,param,viz med
  class plot done

  open --> all
  open --> mod
  open --> analysis
  open --> test
  open --> viz
  open --> admin

  viz --> selecta
  selecta --> selectr
  selecta --> pick
  viz --> pick
  selectr --> plot
  viz --> plot
  selectr --> param
  viz --> param
```
