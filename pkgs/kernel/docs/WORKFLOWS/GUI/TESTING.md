---
order: 50
icon: beaker-24
---

# Testing

The ability to create tests for verifying the correctness of models or detecting
regressions is an integral part of the model development process. These will be
refered to as "runtime tests". The point is that these tests require us to
perform an analysis and compare the results against some reference set of
results (or prescribed results). Another class of tests are onces that check the
validity of the models _prior_ to performing any computations. These will be
referred to as "static tests".

The tasks associated with this are laid out in this section. To orient
ourselves, let's view the various testing related tasks in the context of the
open application and the other models of operation:

```mermaid
---
title: Testing
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

  runtime[Runtime Tests]
  create[Create Test from Analysis]
  params[Define Parameters for Test]
  init[Define Initial and Final Conditions]
  signals[Define Reference Signals]
  static[Static Checks]
  semantic[Semantic Checks]
  balance[Balanced Equations]

  style all color:#ccc
  style mod color:#ccc
  style analysis color:#ccc
  style viz color:#ccc
  style admin color:#ccc

  class create,params,init,signals,runtime med
  class test,static,semantic,balance high

  open --> all
  open --> mod
  open --> analysis
  open --> test
  open --> viz
  open --> admin

  test --> runtime
  runtime --> create
  runtime --> params
  runtime --> init
  runtime --> signals

  test --> static
  static --> semantic
  static --> balance
```
