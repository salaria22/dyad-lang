---
icon: ":straight_ruler:"
---

# Analysis

Currently, the only "things" that can be defined in Dyad are `connector`s,
`type`s and `component`s. But in order to improve the experience of the
Dyad GUI and to unlock the potential of some of our other Dyad related
capabilities, we have discussed the possibility of adding another type of
definition. This document discusses the details of implementing such a
possibility.

## Naming

The first issue here is naming. This functionality in JSMO has traditionally
been called "Experiments". But I propose we change that to "analysis". The
reason is that an experiment corresponds to a single event. As a result, the
term experiment doesn't really seem like the proper term for something like a
Monte-Carlo analysis or the collection of experiments generated via a "Design of
Experiments" (DoE) approach. Analysis on the other hand conveys that there is
some overarching high-level goal to be achieved.

So the remainder of this document will use the term "analysis" and will identify
the various types of analysis we might consider supporting.

## Why?

Dyad currently supports general metadata. In fact, it already has a
standardized metadata schema that corresponds to the existing experiment
abstractions. So what more needs to be done?

Well, an important thing to understand about Dyad is that metadata is very
good at representing structure data _without semantics_. So if we need to
capture mathematical relationships, or complex relationships between data, then
metadata only provides very limited expressiveness.

For these reasons, we are exploring promoting the notion of an analysis to a
"first class" entity in Dyad. As we shall see as we explore the potential
design, there are many compelling reasons to take this approach.

## Basic Syntax

Following the aesthetics of other Dyad constructs, the proposed syntax would
be:

```
analysis <AnalysisName>
  ...
end
```

But the real question is, what kind of information should be included? In fact,
this will depend strongly on the type of analysis being performed. Different
types of analyses will require quite different types of information. For that
reason, the following section will go over several different types of analyses
and discuss what type of information would be required in each case.

## Types of Analysis

Before discussing all the types of analysis, we need to discuss how to express
what type of analysis this will be. Again, following along with both the
existing syntax while trying to also convey similar intuitions on the semantics,
the proposal is to use the `extends` syntax. This is somewhat analogous to how
physical quantities are defined, _e.g.,_

```
type Voltage = Real(units="V")
```

The idea is that we start with some "built-in" entity (_e.g.,_ `Real` in the
case of physical types) and then we build upon that. And, just like with
physical types, it is possible to _further_ extend things with repeated uses of
`extends`. In the case of physical types, this looks like:

```
type Length = Real(units="m")
type Radius = Length(min=0)
```

Applied to analyses, this will mean defining first a set of "built in" analyses
types (_e.g.,_ `Real`) **and** defining some kind of schema to define what each
analysis type requires in order to be considered complete (and what additional
details can optionally be provided as well). Such schemas will **not** be
defined in Dyad syntax but will simply be "built in" to the language kernel.
Adding the kind of metaprogramming required to define new definition types is
just beyond the scope of Dyad as it stands now.

The remaining sections expand this proposal with additional information about
different types of analyses, what information must and could be provided and
some explanations of semantics for cases where it may not be so obvious.

### Steady State

The first proposed analysis type is to perform a steady state analysis. The
term "steady state" can mean different things to different people but in this
context it means to solve for the initial conditions of a given system. One
could also simply refer to this as an initialization analysis. The choice of
term is not important here. What is important is that **time** is not a factor
(except in so much as it is a constant during such an analysis).

The syntax for such an analysis would be:

```
analysis SteadyStateAnalysis1
  extends SteadyState()
  model = RLCModel()
end
```

!!! Hyper Parameters

Often the terms "hyper parameters" is used to describe parameters about the
training of neural networks or other machine related techniques. Here the term
will be used to describe the parameters that govern (potentially various
aspects) of the _analysis_ and **not** the parameters of the system or systems
that capture the mathematical behavior itself.

!!!

The hyper parameters related to the `SteadyState` analysis type should be
expressed as "modifications" in the `extends` clause, _e.g._,

```
analysis SteadyStateAnalysis1
  extends SteadyState(analyticalJacobians=true)
  model = RLCModel()
end
```

During code generation, these parameters might map to various aspects of the
"scaffolding" used to setup the experiment and, if necessary, they could be
hierarchical in nature, _e.g.,_

```
analysis SteadyStateAnalysis1
  extends SteadyState(solver(analyticalJacobians=true), simplification(subexpressionElimination=false))
  model = RLCModel()
end
```

At a _minimum_, the steady state analysis requires the definition of a `model`
component. This will provide the algebraic equations involved. So the "schema"
for a steady state analysis should include the specification of a `model`
component.

You may also wish to "promote" a parameter in the model into a parameter of the
analysis. This could be accomplished as follows:

```
analysis SteadyStateAnalysis1
  extends SteadyState()
  model = RLCModel()

  parameter R = model.R
end
```

!!! Type Inference

Currently, Dyad doesn't allow inference of `parameter` types (like shown
above). But this would be a useful feature to implement for many different
reasons. But there are still some technical details to work out (_e.g.,_ how to
apply modifications to attributes like `min` in the absence of an explicit type
to apply them to).

The alternative would be the more verbose syntax:

```
analysis SteadyStateAnalysis1
  extends SteadyState()
  model = RLCModel()

  parameter R::Real(min=-10,max=10) = model.R
end
```

...which could be used in cases where modifications needed to be applied (or
potentially something like `auto` in C++).

!!!

### Transient

Generally, a transient analysis will involve the same information required for a
steady state analysis since establishing initial conditions is a necessary
first step. But in addition, it would generally require _additional_
hyper-parameters related to the integration methods used to solve the
differential equations.

So such an analysis might be expressed as:

```
analysis MyTransient
  extends Transient(integrator="tsit")
  model = RLCModel()
end
```

There are cases where a user might want to skip solving for the initial
conditions and instead simply "import" a set of initial conditions that have
already been computed. So that should be possible with the `Transient`
analysis but the syntax for expressing that hasn't yet been thought through.

### Optimization

Optimization problems bring a whole additional "level" to our discussion. An
optimization problem is generally optimizing the results of _another analysis_.
So let's assume we have specified a transient analysis as follows:

```
analysis Problem
  parameter R = model.R
  parameter C = model.C
  extends Transient()
  model = RLCModel()
end
```

Then we might define the optimization of this problem as follows:

```
analysis OptimizeIt
  parameter R::Resistance(min=10,max=20) = result.R
  parameter C::Capacitance(min=1m,max=10m) = result.C
  extends Optimization(method="multiple_shooting")
  result = Problem()
relation
  cost = result.inductor.i*result.inductor.v
  result.resistor.v <= 100
end
```

The idea here is that an optimization relies on performing some other analysis
and then expressing the cost and constraints in terms of the results of that
other analysis.

### Sensitivity

### Statistical Analysis

```

```

```

```
