---
icon: ":world_map:"
---

# Implementing "Path" Variables

## The Problem

One issue with Modelica that I've long been annoyed by is the inability to
propagate
information _via_ connections. In Modelica, information is generally propagated
top down in the hierarchy. For many cases, this works well. But there are also
many cases where it is incredibly unintuitive and tedious.

In contrast, MTK has its so-called "domain" capability (a name that apparently
originates with Brad). I want to implement similar functionality in Dyad but in
talking with Brad we both agreed that the term "domain" doesn't really fit and
can be confusing because in engineering domains are typically things like
"mechanical", "electrical", "thermal", _etc_. Furthermore, that functionality
isn't capable of propagating structural information which is a requirement for
multi-phase or multi-species fluid systems.

So we need a better name and to tweak the semantics. The goal here is that
when someone reads the Dyad code the meaning of the code is as obvious as
possible. But before getting into the actual name, we really need to make sure
we understand what the names need to convey.

## The Background

Consider a Dyad `connector` for modeling fluid flow:

```
connector Port
  potential p::Pressure
  flow m_flow::MassFlowRate
end
```

This is a perfectly fine connector definition. We can represent the pressure,
`p`, at the port and the mass flow rate, `m_flow`, flowing through the port. So
far so good. But if we build a component model, we need to represent the density
of the fluid. So we could create a component like this:

```
component Volume
  parameter V::Volume
  # Nominal pressure
  parameter p0::Pressure
  # Nominal density
  parameter rho0::Density
  # Compressibility of fluid
  parameter beta::Compressibility
  port = Port()
  # Mass of fluid in volume
  variable m::Mass
  # Density of fluid in volume
  variable rho::Density
relations
  rho = rho0*(port.p-p0)*beta
  m = rho*V
  der(m) = p.m_flow
end
```

But note, the parameters `p0`, `rho0` and `beta` are all parameters **of the
fluid**, not really parameters of this component. Furthermore, `rho =
rho0*(port.p-p0)*beta` hardcodes this particular fluid's representation of
density in the component which is a bit of a mismatch. This means we would need
to implement this same component for each type of fluid we want to implement.
We'll address this topic in detail later but our goal should be write this
component exactly once _for all possible fluids_ and this implementation is far
from meeting that goal. There is another issue with hardcoding the fluid into
the component because we run the risk of having components that are "out of
sync" (_e.g.,_ where one component thinks the fluid compressibility should be
one value of `beta` and another component connected to it is using a _different_
value of `beta` or potentially even having completely different ways of
computing density)

So, we want to solve both of these issues. We don't want to repeat this
information in every single component and we want to ensure that **there is
exactly one** definition of the fluid in the entire hydraulic circuit. In other
words, all the components that this fluid is flowing through need to have the
same understanding of what the fluid is.

Fortunately, we can do this with a very simple addition to the connector. We
can add some information on the `connector`. Since this information is going to be shared by every component along the flow path, we refer to this variable as a `path` variable. Using the `path` qualifier, the `connector` definition would then be:

```
connector Port
  potential p::Pressure
  flow m_flow::MassFlowRate
  # Nominal pressure
  path p0::Pressure
  # Nominal density
  path rho0::Density
  # Compressibility of fluid
  path beta::Compressibility
end
```

Each variable in the connector has different qualifiers. We already have
`potential` and `flow`. But these quantities have the `path` qualifier on them.
Each of these qualifiers is here because they **each have different semantics**.
In other words, each of these different qualifiers does something different when
you connect things. In the case of `path`, what this does is assert a strict
equality between the values on the different connectors. This is similar to
`potential`, but with an important difference. The `potential` can change from
component to component, but these `path` values have to be identical on all
components in a circuit.

In order to facilitate this, we need one other language construct. We need the
ability to indicate that `path` variables on two different connectors are part
of the same flow path. For this we use the `continuity` relation, _e.g.,_

```
component Pipe
  a = Port()
  b = Port()
relations
  continuity(a, b)
end
```

This `continuity` construct will translate into equations like this:

```
  a.rho0 = b.rho0
  a.p0 = b.p0
  a.beta = b.beta
```

But the important thing to note is that unlike `connect`, it doesn't equate the
`potential` variables and it doesn't sum the `flow` variables. All it is really
doing is conveying "continuity" of the domain. However, while `continuity`
doesn't imply `connect`, it is important to understand that `connect` **does
imply** `continuity`.

With this functionality in place, we can create systems where the fluid
properties are defined in exactly one place in the system and propagated to each
other via the connectors and `continuity` directives.

But we still have the problem here the component models are still specific to on
particular fluid model. So we need to push beyond this and come up with a
formulation that allows us to create just one version of components like
volumes, valves, pumps, etc.

## General Solution

Note, since there are no real equations (_i.e.,_ no algebra) involved in
relating these quantities (only equality), there is no reason we can't actually
make these variables **any kind of value**. Brad and I discussed this in detail
and we came up with an approach that not only addresses the propagation of fluid
properties via connections and connectors (which is one improvement over
Modelica) but also allows us to implement fluid properties without neededing to
define a fixed, closed set of properties (in the way that Modelica does this
with their `replaceable package` formulation of `MediumModel`).

To accomplish this, we first need to reference native Julia types (on which we
can perform multiple dispatch). This can be done as follows in Dyad using the
`Native` type:

```
type MediumModel = Native
```

Then we could define our `Port` model as follows:

```
connector Port
  potential p::Pressure
  flow m_flow::MassFlowRate
  path medium::MediumModel
end

component Pipe
  a = Port()
  b = Port()
  variable rho_a::Density
relations
  # State the continuity relation between the ports
  continuity(a, b)
  # Allows this component model to work with a wide range of fluid property models!
  rho_a = density(a.medium, a.p)
end
```

The assumption in this Dyad code is that there is some external Julia function
called `density` and we are invoking this function by passing in first an
instance of the `MediumModel` type as the first argument and the desired
pressure passed in as the second. So the generated Julia code will make use
of multiple dispatch.

### Defining a Medium Model

But ultimately we need to define an actual medium model. Generally speaking,
you'll want to make the `Native` type specified in Dyad an `abstract` type in
Julia, _e.g.,_

```
abstract type MediumModel end
```

Then you'll want to define some subtype of `MediumModel` to represent a specific
type of fluid, _e.g.,_

```
struct Incompressible <: MediumModel
    rho0
    p0
    beta
end
```

There are three remaining things we need to do. The first is to define the
property functions that leverage the `Incompressible` type for dispatch, _e.g.,_

```
function density(medium::Incompressible, p)
    medium.rho0 * (1 + (p - p0) / beta)
end
```

It is also a good idea to have a fallback version of this function for the
`abstract` type that generates an error in case someone dispatches on the
abstract type:

```
function density(medium::MediumModel, p)
    error("\n\nFunction $name not defined for medium.\n")
end
```

The second thing we need to do is build a function that constructs an instance
of `Incompressible` so that we can create an actual value to pass around from
components to component as a `path` variable:

```
function Beta(; rho₀::Number, p₀::Number, β::Number)
    Incompressible(rho₀, p₀, β)
end
```

Finally, we need to make sure that the property functions can be called by MTK
in the context of symbolic manipulation:

```
@register_symbolic density(medium::MediumModel, p)
```

### Setting the `path` Variable Value

The only thing that really remains is to explain how we actually set the value
of the `path` variable. Because the `path` variable potentially contains
structural parameters, we need to propagate that information from the top down
through the hierarchy. This is to say that you cannot receive the value from a
"sibling" component because, at that point, the structural information cannot be
leveraged because all the components have been constructed. So the information
about `path` must come from a "parent" in the hierarchy at the time that the
child component is created.

To do this, we declare a `path` variable in the parent component (not in a
connector). We then need to declare continuity between that variable and path
variables in any connector, _e.g._

```
component ReservoirTest
  hp = Reservoir()
  # This is one and only place where the actual fluid is specified
  path medium::MediumModel = Beta(rho₀=1000, p₀=101325, β=4e10)
relations
  continuity(medium, hp.port.medium)
end
```

## Conclusion

This provides the rationale for the `path` variable formulation. A complete
worked up example can be found
[here](https://github.com/JuliaComputing/medium-dispatch-example) for reference.
