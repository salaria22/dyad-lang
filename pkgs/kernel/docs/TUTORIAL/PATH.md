# Using `path` variables

## Motivation

In this section, we'll cover how to use `path` variables. But first, we
should explain what a `path` variable is and what it is used for.
The `path` qualifier is used to indicate a variable that is **identical**
across the connection graph. Well, what does that mean and how is that useful.
Well, the main use case is for modeling of fluid systems. It is useful because
all elements along a given flow path in a fluid system, by definition, share the
same fluid and, by extension, the same fluid properties.

By using `path`, we have a way for the Dyad compiler to **automatically**
ensure that all the fluid properties are the same for all components in a flow
path (even when that path involves arbitrarily nested components).

## Simple Example

Let's imagine that we have a fluid system the density of our fluid is
represented by this relationship:

$$ \rho = \rho_0 (1 + \frac{p-p_0}{\beta}) $$

Now we want to write a set of fluid component models such that we only have to
specify the information about the fluid _once_ and then it gets propagated to
all the components.

### Fluid Properties

The first example is actually unnecessarily simple, but we will explore it just
to avoid introducing too many concepts at once. **But note**, a much better
model will be shown in the next section. But keeping with this simple model for
the moment, we could define a `MediumModel` `struct` as follows:

```
struct MediumModel
  rho0::Density
  p0::Pressure
  beta::BulkModulus
end
```

### Connector

All the information about our fluid is present in this `struct`. Now, we want
to ensure that this information is available to all components. To do this, we
add an instance of this to our `HydraulicPort` connector as follows:

```
connector HydraulicPort
  potential p::Pressure
  flow m_dot::MassFlowRate
  path medium::MediumModel
end
```

Note the presence of the `medium` field on our connector. We've specified that
it has the type `MediumModel` and we've **further specified** that it is
`path` across all connectors in the flow path.

### Fixed Volume

Now let's imagine that we want to build a simple fixed volume component. It
might look like this:

```
component FixedVolume
  port = HydraulicPort()
  parameter p0::Pressure
  parameter vol::Volume
  variable rho::Density
  variable m::Mass
relations
  initial port.p = p0
  rho = port.medium.rho0 * (1 + (port.p - port.medium.p0) / port.medium.beta)
  m = rho*vol
  der(m) = port.m_dot
end
```

We don't need any `parameter`s in this component for `rho0`, `p0` or `beta`
because these are automatically available via the information on the `port`
connector. The Dyad compiler will take care of making sure that information is
propagated across components, you don't need to worry about this when building
the component model.

### Fixed Pressure Reservoir

Imagine we created a `Reservoir` model to represent some infinite reservoir of
fluid at some fixed pressure, `p0`. In Dyad, such a component would look like
this:

```
component Reservoir
  port = HydraulicPort()
  parameter p0::Pressure
relations
  port.p = p0
end
```

Note, it does not need the fluid properties, so we never reference
`port.medium`. Although if, for some reason, we actually wanted to know the
density of this fluid, we could always implement it as follows:

```
component Reservoir
  port = HydraulicPort()
  parameter p0::Pressure
  variable rho::Density
relations
  rho = port.medium.rho(port.p)
  port.p = p0
end
```

Again, the information about the fluid is available to all components in the
flow path via the `medium` field on the connector.

### System Model

Ultimately, we need to specify the fluid properties to use, right? So how do we
do that. Well, consider the following model:

```
component FluidSystemTest
  res = Reservoir(p0=202k)
  vol = FixedVolume(vol=10, p0=101k)
  pipe = Pipe(k=1.0)
relations
  connect(vol.port, pipe.a)
  connect(res.port, pipe.b)
end
```

We'll come to the `pipe` component in just a second, but what we see here is a
reasonable model of the system. We have a reservoir at a fixed pressure and a
volume with an initial pressure that is half that of the reservoir. Over time,
we expect the flow through the pipe to bring the volume into equilibrium with
the reservoir. Since the reservoir is "infinite", it's pressure will not change
and the volume will eventually be $202kPa$.

But how do we specify the fluid properties to use? All of the components are
connected to each other so they all have the same value for `medium`, but **what
value is it?**. To actually specify the value to use for this model, we need to
add two more lines:

```
component FluidSystemTest
  res = Reservoir(p0=201k)
  vol = FixedVolume(vol=10, p0=101k)
  pipe = Pipe(k=1.0)
  path medium::MediumModel = MediumModel(rho0=1, p0=101325, beta=2)
relations
  # Propagate medium
  continuity(medium, vol.port.medium)
  connect(vol.port, pipe.a)
  connect(res.port, pipe.b)
end
```

The first line:

```
path medium::MediumModel = MediumModel(rho0=1, p0=101325, beta=2)
```

Creates a new variable in our system model. It has the `path` qualifier as
well (just like the field in the `connector`). This is **the** value that will
be used. But with that statement alone there is no relationship between that
variable and the variable in the flow path. For that, we need the second line
in the `relations` section:

```
continuity(medium, vol.port.medium)
```

This statement asserts that the local variable `medium` is part of the same set
of path values as the field `medium` on the `vol.port` connector.

But wait...that sets the value on `vol.port` which means the `vol` component
knows what fluid is being used. But how does the `Reservoir` component, `res`,
know what fluid is being used? To understand this, we need to now look at the
`Pipe` component.

### Pipe

The `Pipe` component assumes a linear flow relationship (mass flow rate is
proportional to pressure drop). This is not physically very realistic, but that
isn't important at this stage. We could have written our `Pipe` model as
follows:

```
component Pipe
  a = HydraulicPort()
  b = HydraulicPort()
  parameter k::Real
relations
  a.m_dot + b.m_dot = 0
  a.m_dot = k*(b.p - a.p)
end
```

The `Pipe` doesn't care so much about the fluid properties (at least, _this
version_ doesn't care). But this model needs one more line in order to really
be complete:

```
component Pipe
  a = HydraulicPort()
  b = HydraulicPort()
  parameter k::Real
  variable rho::Density
relations
  continuity(a.medium, b.medium)
  rho = a.medium.rho(a.p)
  a.m_dot + b.m_dot = 0
  a.m_dot = k*(b.p - a.p)
end
```

Note the addition of the `continuity(a.medium, b.medium)`. This, like the previous
`continuity` relationship we saw, `continuity(medium, vol.port.medium)`, is used to
indicate that these two variables are part of the same path through the model.
We can't use `connect` because the semantic of `connect` imply _much more_
(_including_ that the `path` variables have the same values). The `connect`
relationship is limited to just specifying that these two variables have the
same shared value.

It is this `path` relationship that allows us to infer all the values for
`medium` across all connectors in our `FluidSystemTest` model above.

The propagation effectively works like this. We know `medium` in
`FluidSystemTest`. We also know, because of the
`continuity(medium.vol.port.medium)` statement that `vol.port.medium` as the same
value. But because of the `connect(vol.port, pipe.a)` relationship we further
know that `pipe.a.medium` as the same value as `vol.port.medium`. Next, the
`continuity(a.medium, b.medium)` inside the `Pipe` model propagates this value to
the `b` connect. That `b` connector is eventually connected to our `res`
component so now _it_ has the same value for `medium` as well.

The key point here is that we just need to build the components in such a way
that we make it clear which paths through the components share fluid properties
and the Dyad compiler takes care of all the rest.

## A Better Medium Model

### The Problem

I mentioned earlier that this `MediumModel` was unnecessarily simple. Note that
even though we provide three parameters, `rho0`, `p0` and `beta`, the components
just use these to compute the density, `rho`.

Imagine an analysis came along where we could no longer assume:

$$ \rho = \rho_0 (1 + \frac{p-p_0}{\beta}) $$

For example, imagine that we needed to compute $\rho$ by interpolating from a
table or using some other analytic expression. In that case, we'd need to
rewrite all these component models _because the computation of $\rho$ is
embedded in the components_!

### New Definition

But there is a much better way to go about this. Let's define our `MediumModel`
like this instead:

```
type DensityProperty = func(Pressure)::Density

struct MediumModel
  rho::DensityProperty
end
```

What this is saying is that we now have just one field in our `MediumModel`,
`rho` and it has the type `DensityProperty` which is a **function** that takes a
`Pressure` and returns a `Density`.

### Simpler and More Flexible Components

Now, our component models **don't need to know how to compute $\rho$**. Instead,
the **medium model does it for them**. This has two effects. First, the component
models are simple:

```
component FixedVolume
  port = HydraulicPort()
  parameter p0::Pressure
  parameter vol::Volume
  variable rho::Density
  variable m::Mass
relations
  initial port.p = p0
  rho = port.medium.rho(port.p)
  m = rho*vol
  der(m) = port.m_dot
end
```

Second, it means we can switch to a much wider range of fluid models, not just
the ones characterized in terms of `rho0`, `p0` and `beta`!

### Defining a Fluid Model

Recall that in `FluidSystemTest`, we need to specify the actual fluid to be
used. Now we do that something like this:

```
component FluidSystemTest
  res = Reservoir(p0=101k)
  vol = FixedVolume(vol=10, p0=101k)
  pipe = Pipe(k=1.0)
  path medium::MediumModel = Beta(rho0=1, p0=101325, beta=2)
relations
  # Propagate medium
  continuity(medium, vol.port.medium)
  connect(vol.port, pipe.a)
  connect(res.port, pipe.b)
end
```

This is the same model, the only thing that has changed is the _value_ that we
have given to `medium`. In this case, the `Beta` function is defined in Julia
as follows:

```
function Beta(; rho0, p0, beta)
    rho = p -> rho0 * (1 + (p - p0) / beta)
    MediumModel(rho=rho)
end
```

As you can see, it takes the characteristics of our fluid, `rho0`, `p0` and
`beta` and uses them to create an instance of our `MediumModel` `struct` that
just uses a closure as the value for `rho`.

They key point is that this function could just as easily perform some kind of
interpolation in `p` or evaluate `rho` as a complex polynomial **and you would
never have to change any of the component models**.
