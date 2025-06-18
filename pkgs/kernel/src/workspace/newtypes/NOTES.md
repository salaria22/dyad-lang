# Representation of Types

What do we need a representation of types for? Types are constraints
on values. So what is needed is a way of describing the constraints on values.

The first issue we need to consider is what are "values" in Dyad? Since Dyad is, in some sense, simply a way of representing complex hierarchical "information", every node such a tree is a possible value.

Every `Definition` type in Dyad is potentially such a tree.

## Variables

Let's start simple...variables. Something like this in Dyad:

```
  variable x::Foobar
```

What values can be assigned to this? Well, we can't actually say without knowing what `Foobar` is. Consider this definition of `Foobar`:

```
type Foobar = Integer
```

In this case, `x` is just a scalar integer valued variable. But we could just as easily define `Foobar` as:

```
struct Foobar
  re::Real
  im::Real
end
```

This would be very different not just in the values that could be assigned to it, but in the _structure_ of those values (scalar values wouldn't even make sense for a variable whose underlying type is a struct).

In a similar way, `x` could be a function and `Foobar` could be describing the types of arguments and the return value, _e.g.,_

```
type Foobar = func(::Real, ::Integer)::Boolean
```

Now in all these cases, there is a definition we can point back to. So can we
just map types to a definition and be done with it? This because we want the convenience of "type constructor" constructs in the grammar. A type constructor is just a syntax that "takes types" as an argument and produces another "type". So, for example, consider this declaration:

```
  variable x::Real[4]
```

It wouldn't be accurate to say the type of `x` was `Real`. That is because `[...]` is a type constructor. It takes some underlying type, _e.g.,_ `Real`, and then transforms it into another type. A similar thing can happen, for example, if we are declaring a variable that is a function, _e.g.,_

```
  variable x::func(::Real, ::Integer)::Foobar
```

So the bottom line is that the type is formulated in terms of a type expression. For example, consider:

```
  variable x::func(::Real[4], ::Integer[4,4])::Foobar
```

...which, if visualized as a tree, might look like:

- Function
  - arg0: Array
    - elem: Real
    - dims: [4]
  - arg1: Array
    - elem: Integer
    - dims: [4, 4]
  - ret: Foobar

But in this case, `Foobar` is it's own type. Let's assume it is defined as
`type Foobar = func(::Real, ::Integer)::Boolean`. We can think of this as a
"variable" in this type expression and substituting that variable in we get:

- `Function`
  - arg0: `Array`
    - elem: `Real`
    - dims: [4]
  - arg1: `Array`
    - elem: `Integer`
    - dims: [4, 4]
  - ret: `Function`
    - arg0: `Real`
    - arg1: `Integer`
    - ret: `Boolean`

So the leaves of the trees here (at least for _variables_) have to be one of the
following types:

- `Real`
- `Integer`
- `Boolean`
- `String`
- `Native` (opaque value from Julia)

All the non-terminals here are some form of type constructor. For now, we can
deal with a few primitive type constructors like the ones shown above (for
defining array types or function types).

But we need a bit more expressiveness so let's look into a few more topics.

## `struct` (Product Type)

Beyond arrays (which are collections of values that are all of the same type),
we also need things that are non-homogeneous. For this Dyad has `struct` types.
A `struct` is composed of zero or more named fields. Each field has its own
type. Again, complex types are possible, _e.g.,_

```
struct S1
  x::func(::Real)::Density
  y::Integer
  z::Foobar
end
```

## `enum` (Sum Type)

Dyad also features an `enum` type which can be viewed almost exactly as a
mutually exclusive set of struct types. Each of these mutually exclusive types
has fields and each of those fields a (potentially complex) type. But the
value for an `enum` knows _which_ of these mutually exclusive types it is.

## Components

Everything discussed so far applies to variables (and parameters). But what
about declarations of components? In some sense, a `component` in Dyad is
similar to a struct. Except `components` don't just have "fields" (_e.g.,_
variables/parameters) in them. They have other components, connectors and
relations.

Earlier, we discussed the fact that types are constraints on possible values.
What does this mean in the context of components? Well, imagine if we wanted to
switch one component instance for another? The type determines if such a
substitution should be allowed. Consider the following simple model:

```
component Circuit
  ground = Ground()
  source = VoltageSource(V=100)
  resistor = Resistor(R=100)
relation
  connect(ground.g, resistor.n)
  connect(ground.g, source.n)
  connect(source.p, resistor,p)
end
```

One guiding principle here is the [Liskov Substitution
Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle). Let's
say we want to replace `resistor` with something? Could we replace `resistor`
another `Ground`? If we did, the model would break because this `Circuit` model
_implicitly expects_ that `resistor` has a connector called `n` since it
references `resistor.n`. Furthermore, that connector `resistor.n` needs to be
connectable to `ground.g` in order for the relation `connect(ground.g,
resistor.n)` to remain valid.

Now, one thing we could do is _infer_ the types of `ground`, `source` and
`resistor`. If we did that, we might find it could be expressed by the
following explicit constructions:

```
partial component ResistorInterface
  p = Pin()
  n = Pin()
end

partial component VoltageSourceInterface
  p = Pin()
  n = Pin()
end

partial component GroundInterface
  g = Pin()
end

component Circuit
  ground::GroundInterface = Ground()
  source::VoltageSourceInterface = VoltageSource(V=100)
  resistor::ResistorInterface = Resistor(R=100)
relation
  connect(ground.g, resistor.n)
  connect(ground.g, source.n)
  connect(source.p, resistor,p)
end
```

**NB** For the purposes of this example, `ResistorInterface` is not a real
explicit type but simply a representation of the _implicit_ type that we could
infer from this model.

The addition of, for example, `::ResistorInterface` after `resistor` is a way of
expressing that "values" for `resistor` need to at least have two `Pin`s named
`p` and `n`. We could infer this simply by analyzing the `Circuit` model to
determine what parts of `ground`, `resistor` and `source` are actually
referenced in this model and then constructing a "minimal type" that must be
adhered to by each of these components in order to ensure substitutions will
always lead to a valid component.

But is this sufficient? What about the parameters `source.V` or `resistor.R`?
These aren't actually referenced by the `Circuit` definition. These are just
needed to provide the initial/default "values" for `source` and `resistor`. To
understand this, consider a simpler example. Imagine we had:

```
  x = 3.2
relation
  der(y) = x
```

...and we wanted to infer the type. Would we assume that `x` must have the
value `3.2`? No, that is just one possible value. From the actual usage we can
determine that `x` must be a number (otherwise its use on the rhs of a
differential equation doesn't really make sense). We also know that it can't be
(strictly) an integer because then we wouldn't be able to assign the initial
value. So the "minimal type" for `x` needs to be `::Real` in this case. But we
can't assume anything more than that (_e.g._ that it needs to be positive)
because nothing in our references to `x` indicates anything more than the fact
that it is a floating point value.

OK, so should we just infer the types of components? Well, we certainly could.
But what about this:

```
component Circuit
  parameter R::Resistance
  ground = Ground()
  source = VoltageSource(V=100)
  resistor = Resistor(R=R)
relation
  connect(ground.g, resistor.n)
  connect(ground.g, source.n)
  connect(source.p, resistor,p)
end
```

Does this change anything? No, not really. Yes, the `Circuit` component
contains a parameter `R` and _by default_ that value is used to initialize
`resistor.R`. But does that break the model if we replace `Resistor` with a
capacitor? No...because the requirement to assign the value of `resistor.R` to
be equal to the `Circuit'`s parameter `R` is not a constraint on the model
because it is only used to set the initial value for `resistor`. To see this,
we could replace the _value_ of `resistor` as follows and everything would work
just fine:

```
component Circuit
  parameter R::Resistance
  ground = Ground()
  source = VoltageSource(V=100)
  resistor = Capacitor
relation
  connect(ground.g, resistor.n)
  connect(ground.g, source.n)
  connect(source.p, resistor,p)
end
```

Sure, the parameter `R` is pretty much useless now...but that's not the same as
being wrong. But what if we, as the creators of `Circuit` _want_ to enforce a
constraint that the component `resistor` always had a parameter `R` of type
`Resistance`. Well that would correspond to our previous example where
`ResistorInterface` was instead:

```
partial component ResistorInterface
  parameter R::Resistance
  p = Pin()
  n = Pin()
end
```

We can't _infer_ that from our model, but we might (as component developers)
want to constrain `resistor` in this way. In that case, we could certainly
_explicitly_ define a type like `ResistorInterface` and put `R` in it.

Note, however, that this only ensures that `resistor` always has a parameter
called `R`. It **does not** ensure that the value of `resistor.R` is set to the
`R` parameter in circuit. But if we defined `ResistorInterface` to include `R`,
we could express this in our `Circuit` model as follows:

```
component Circuit
  parameter R::Resistance
  ground = Ground()
  source = VoltageSource(V=100)
  resistor::ResistorInterface(R=R) = Resistor()
relation
  connect(ground.g, resistor.n)
  connect(ground.g, source.n)
  connect(source.p, resistor,p)
end
```

The semantics of those "modifications" applied to `ResistorInterface` are that
those modifications should be applied to **all** `resistor` instances. In such
a circumstance, trying to insert a `Capacitor` as follows:

```
component Circuit
  parameter R::Resistance
  ground = Ground()
  source = VoltageSource(V=100)
  resistor::ResistorInterface(R=R) = Capacitor
relation
  connect(ground.g, resistor.n)
  connect(ground.g, source.n)
  connect(source.p, resistor,p)
end
```

...wouldn't work because `Capacitor(R=R)` doesn't make any sense...`Capacitor`
doesn't have an `R` for us to set.

So the point is that while we could implicitly infer the type of `resistor`
based on what parts of `resistor` are referenced, there are many use cases where
we would want to specify not just a type constraint on the component but also
force specific modifications to be performed on that component.

So, as we've discussed, to legally substitute one component for another the
constraints are determined by all the ways we might reference the contents of
the component being replaced. So let's enumerate all the possible elements of a
`component` that could be referenced:

1. Any `connector`s referenced in `connect` statements.
2. Any `parameter`s referenced in the modifications associated with the explicit
   type of the component.
3. Any `continuity` relations need to be considered as well. This is because
   inferring the equality of `path` variables depends on (some of?) the
   `continuity` relations contained in a component.

It is worth saying explicitly that `variable`s and `relations` (apart from
`continuity` relations) are **not** part of the components public interface
(since they cannot be referenced or inferred by parent components).

## Analyses

## Inheritance

## Subtype

## Type Parameters
