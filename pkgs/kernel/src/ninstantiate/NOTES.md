# Detailed Elaboration Use Cases

## Semantic Checks

- Should be *local* to a given file level statement
- Does not care *at all* about metadata!  This is important because metadata changes will therefore not cause these check to be re-run

### Process

#### Scalar Type Definition

- Resolve base type
- Check it is a scalar type (builtin or definition)
- Check all local expressions
  - Resolve (and store?) types for all component references in expressions
  - Infer type
- Check modification values are consistent with base type

#### Scalar Connector Definition

- Resolve base type
- Ensure it extends a *scalar type*
- Check all local expressions
  - Resolve (and store?) types for all component references in expressions
  - Infer type
- Ensure modifications are consistent with base type

#### Composite Connector Definition

- Check all local expressions
  - Resolve (and store?) types for all component references in expressions
  - Infer type
- Check local declarations
  - Ensure no duplicates
  - Determine type
  - Ensure all potentials have 1:1 flow
  - Ensure all streams have exactly 1 flow
  - Ensure modifications are consistent with declaration type

#### Component Definition

- Get *type* for all base definitions.
- Check all local expressions
  - Resolve (and store?) types for all component references in expressions
  - Infer type
- Check modifications to ensure they are legitimate values given the type constraints of the base definition.
- Check local declarations
  - Ensure no duplicates with self with base definitions
  - Determine type of local declaration
  - Ensure any default/init value conforms to specified type
  - Ensure modifications are consistent with declaration type
- Check local relations
  - Ensure no overlap with named relations from base definition (require `override`?)
  - Resolve type for all declarations
  - Perform semantic check for each type of relation
    - Equation: check LHS and RHS are type compatible and have consistent units
    - Connections: check connections are valid
    - Assertions: Nothing to check?
- Check continuity for non-`partial` component
- Check for values for all non-`partial` components
- Check balance for all non-`partial` components

#### Analysis Definition

Same as `ComponentDefinition` for the most part.  Initial base class
information needs to be resolved as a special step by reading JSON schema (eventually).

### By Products

This information can then be used by subsequent passes

- Definition that was semantically checked
- Types and entities of base definitions
- Value expressions for all elements
- All relations (with origin and index)
- Types of all component references
- Continuity sets

## GUI Editing

- Needs to provide all information about inherited elements
- Requires origin information and indices

### Additional Steps

- Flatten (and track) all _metadata_ as well (both definition and declaration)
- Render diagram and icon

## Code Generation

- Does this require anything above and beyond GUI Editing?
- Is there anything GUI Editing requires that Code generation doesn't?

# Degrees of elaboration

Unflattened component with all symbols resolved + "values"

- Resolve symbols to types (local semantic analysis, sufficient for code gen?)
  - Then flatten (useful for component editing)
- Flatten component but keep symbols (use case?)
  - Then resolve symbols to types (back to component editing)

From the above analysis, it seems like what we need is:

Definition w/ Entities -> Definition w/ Types -> Flattened Definition w/ types

...in other words, the pipeline is:

1.  Resolve names and values to entities (including scoped variable names)
2.  Resolve entities to types (in scoped variables as well) and values to instance values
3.  Perform semantic checks of types vs. values
4.  Semantic checks of relations
5.  Flatten extends.

We could memoize the `entity` -> `type` mapping!

Values:

- Variables -> Expressions
- Connector/Component/Analysis -> Constructor function
  - Involves modifications (values for contents)

export type InstanceValue = JuliaValue | ConstructorFunction;

type Temperature2 = Real(units="K")

partial component TwoPin
p = Pin2() [{ ...position... }]
n = Pin() [{ ...position... }]
end

component Resistor
extends TwoPin(p [{ ...position... }])
relations
connect(p, g.p)
end

component Hello

# MTK Code Gen flattens this

extends Main
x::Temperature

# MTK Code Gen doesn't flatten this

r = Resistor()
relation
der(x) = -x
end

AST <-> Parser <-> "Semantics" <-> Code Generation (IR)

GUI (VS Code): Fully Reactive processing

Goals:

- Code Generation (different degrees flattening)
- Graphic Editing
- Static checks (generally don't want flatten)

Entity (fully qualified name)

- Library
- Module
- Definition
- File
- Builtin Type

Either<Error,T>

Result<T> = FailedResult<unknown> | SuccessfulResult<T> | PartialResult<T>

- Zero or more "problems" (RFC 7807/9457)
- Zero or one values of type `T`

```
component Hello
  extends Main(R=100) -> Type
  x::Temperature = 10
  r::TwoPin = Resistor(R=100)
  r2 = Resistor(R=100)
relation
  connect(a, b);
  der(x) = -x
end

component H2
  extends Hello(r2)
end
```

```
component System
  h1 = Hello()
  h2 = Hello()
end
```

Pipeline<T> = Observable<Result<T>>

1. Resolve Tokens => Entities (forget about scoping)
2. Resolve Entities => Type (structural description)
3. Perform Semantic Checks =>
4. Semantic of relations
5. Flatten extends (get rid of inheritance)

X <-> Y <-> Z
^ ^
| |
+-------------+ <- CompressibleMedium()

y = Y()

continuity(a.path, b.path)

component System
x::HasContinuity = X()
y = Y()
z::HasContinuity = Z()
path medium::MediumModel = CompressibleMedium()
relations
continuity(x.a, medium)
connect(x.b, y.a)
connect(y.b, z.a)
connect(z.b, x.a)
end

component HasContinuity
a = Port()
b = Port()
relation
continuity(a, b)
end

component Pipe
extends HashContinuity
end

component System2

# THIS IS AN ERROR

extends System(x = NoContinuityX(), z = NoContinuityZ())
end

Work backward
Implement semantics as local as possible
Potential different IRs for each "consumer"
Have one representation for type and one for type + implementation (the former being a subtype of the latter)
