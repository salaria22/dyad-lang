---
icon: ":world_map:"
---

# Analyses

## Motivation

The notion of treat an analysis as a first class object is something that
distinguishes Dyad from Modelica. In the Modelica world, we only define the
model...we say nothing of what one might **do** with the model.

But in Dyad we want to expose not just the model but a range of things one might
do with that model. Initially, we implemented a transient analysis and an
optimization analysis. But in considering this further, we recognized a few
things. First, there are many possible types of analysis (linearization, PID
auto-tuning, generation of reduced order models, _etc._). Furthermore, adding
the semantic processing for each fo these would be a bottleneck for adding new
analyses. So, we hatched upon an idea (elaborated below) whereby Julia
developers could author their own analyses and then publish them in such a way
that the Dyad kernel wouldn't require _any_ changes to incorporate the new
analysis type. This could really open the doors not only to adding a wide range
of SciML based analysis but allow _customers to do the same_. In fact, this
scheme should also allow us to introduce nested analysis types (or
"meta-analyses") where we want to wrap one analysis around another.

An example of a nested analysis might be to construct a model of a fairly
complex plant. Then, study the uncertainty around the performance of that plant
by introducing statistical distributions for some of the design parameters in
the plant model and then looking at the statistical variation of the plant's
performance in the context of such uncertainty around the design variables. So
the statistical analysis (easily implemented in Julia) is just a "regular
analysis" since it can be performed on a model. But then, we might want to
perform an optimization analysis _of the statistical analysis_. Specifically,
trying to minimize the standard distribution (or some other measure of
uncertainty) in the model outputs and, thus, improving the overall robustness
(_e.g.,_ against manufacturing variability). So this optimization analysis
_wraps_ another analysis (hence the term "nested analysis"). [This
paper](https://modelica.org/events/Conference2005/online_proceedings/Session5/Session5a1.pdf)
goes into greater detail on this notion of meta-analyses (although in the paper
the term "nested analysis" is used).

## Implementation

There are several important properties we want in this system:

- It should be **easy** to write Julia code for an analysis
- It should be **easy** to _publish_ this Julia based analysis. In this case
  "publish" means not only making the analysis available somehow (_e.g.,_ via
  the invocation API) but also describing the **inputs** to the analysis is some
  language neutral way.
- The kernel needs to use this language neutral representation of the input data
  in order to perform its semantic analysis.
- The user needs to be able to instantiate and even _`extend`_ these analysis
  types with specifics.
- The GUI needs to be able to use this language neutral representation in order
  to provide the user with a nice UI dialog for instantiating an analysis they wish
  to perform.

So with all this in mind, we've agree on [JSON Schema](https://json-schema.org/)
as the language neutral representation of an analysis.

## Example

Let's work through an example of implementing an analysis both from the
perspective of the Julia developer and from the perspective of the Dyad
developer with some commentary interspersed about the design on both the Julia
and Dyad kernel side.

The analysis we will implement is the "transient analysis" which is quite a
simple type of analysis but includes all the relevant features we need to worry about.

### Julia

We want implementation of the Julia analysis to be easy. We'll discuss three
different aspects of the Julia implementation.

1. The formulation of the input data as a native Julia `struct`
2. The code that actually performs the analysis
3. The JSON Schema representation of that _same_ `struct`

This not necessarily the order that the Julia developer will follow, but we'll
talk about that a bit more at the end.

#### Input Data

But let's start with defining the input information as a native Julia `struct`:

```julia
Base.@kwdef struct TransientAnalysisSpec
    # Analysis Type
    name::Symbol
    # Integration scheme to use
    integrator::Union{Nothing,Symbol}
    # The model to simulate
    model::ODESystem
    # Absolute tolerance to use during the simulation
    abstol::Float64
    # Relative tolerance to use during the simulation
    reltol::Float64
    # Start time of simulation
    start::Union{Nothing,Float64}
    # Stop time of simulation
    stop::Float64
    saveat::Union{Nothing,Float64,AbstractVector{Float64}}
    # Maximum time step (isn't this just a band-aid for lack of events?)
    dtmax::Union{Nothing,Float64}
end
```

A few things to notice. First, we see the `Union{Nothing, T}` pattern several
times. This is the Julia equivalent of an `Option` type. In this case, it
indicates that the user need not specify a value for these things. The
assumption here is that the analysis can determine reasonable defaults for these
values on its own.

An important consideration in developing the Julia code is to avoid leaky
abstractions. For our (Dyad's) purposes, we need to be able to serialize
and deserialize this information. But **we don't want to place any cognitive
burden** on the analysis developer (remember, this work might be done by a
_customer_) related to this serialization/deserialization issue. That should
all be taken care of by our implementation of serialization and deserialization
**behind the scenes**.

#### Julia Code

Our plan is to use multiple dispatch on the `run_analysis` function for
analyses. What this means is that the analysis developer will implement a
method for the `run_analysis` function that takes an instance of the so-called
"spec" described previously (an instance of the Julia `struct`) and returns some
kind of solution.

At this point, we need to discuss a bit about abstract types. For each
analysis, the analysis developer will need to define their own versions of the
following abstract types:

- A "spec" type that is a subtype of `AbstractAnalysisSpec`
- A "solution" type that is a subtype of `AbstractAnalysisSolution`
- A method of `run_analysis` that takes their spec as an input argument and
  returns their solution as its return type

So, for example, our `TransientAnalysisSpec` struct would actually need to be
defined like this:

```julia
Base.@kwdef struct TransientAnalysisSpec <: AbstractAnalysisSpec
    # Analysis Type
    name::Symbol
    # Integration scheme to use
    integrator::Union{Nothing,Symbol}
    # The model to simulate
    model::ODESystem
    # Absolute tolerance to use during the simulation
    abstol::Float64
    # Relative tolerance to use during the simulation
    reltol::Float64
    # Start time of simulation
    start::Union{Nothing,Float64}
    # Stop time of simulation
    stop::Float64
    saveat::Union{Nothing,Float64,AbstractVector{Float64}}
    # Maximum time step (isn't this just a band-aid for lack of events?)
    dtmax::Union{Nothing,Float64}
end
```

Note the inclusion of `<: AbstractAnalysisSpec`. Similarly, our solution will
be defined as:

```julia
struct TransientAnalysisSolution{SP,S} <: AbstractAnalysisSolution
    spec::SP
    sol::S
    prob_expr::Expr
end
```

Finally, we define a Julia function to transform the spec into a solution. In
our case, this would look something like this:

```julia
solvers = Dict(:auto=>..., :Rodas4=>..., :FBDF=>..., :Tsit5=>...)
function run_analysis(spec::TransientAnalysisSpec)
    start = something(spec.start, 0)
    dtmax = something(spec.dtmax, spec.stop-start)
    alg = solvers[something(spec.integrator, :auto)]
    saveat = something(spec.saveat, ())
    prob = setup_prob(spec.model, [], (start, spec.stop), (;))
    sol = solve(prob, alg; spec.abstol, spec.reltol, dtmax, spec.saveat)
    stripped_sol = strip_solution(sol)
    sys = sol.prob.f.sys
    prob_expr = ODEProblemExpr{true}(sys, [], (start, spec.end))

    res = TransientAnalysisSolution(spec, stripped_sol, prob_expr)
    return res
end
```

Note that this function also handles providing values in place of `nothing`s.
All totalled, this function is pretty simple. And the `TransientAnalysisSpec`
is a very easy to understand `struct` for potential users to fill in.

There are other functions, besides `run_analysis`, for whom custom methods will
need to be provided to support things like generation of post-processing
artifacts. But these will be documented later.

#### JSON Schema

At the end of the day, we need a way of communicating the contents of
`TransientAnalysisSpc` in a **language neutral** way. This is where JSON Schema
comes in. For this example, our JSON schema representation looks like this:

```json
{
  "title": "TransientAnalysis",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Analysis Type",
      "default": "TransientAnalysis"
    },
    "integrator": {
      "enum": ["auto", "Rodas4", "FBDF", "Tsit5"],
      "default": "auto"
    },
    "model": {
      "type": "string",
      "description": "Name of the model to use in the analysis",
      "julia:type": "ODESystem"
    },
    "abstol": {
      "type": "number",
      "description": "Absolute tolerance to use during the simulation"
    },
    "reltol": {
      "type": "number",
      "description": "Relative tolerance to use during the simulation"
    },
    "start": {
      "type": "number",
      "description": "Start time of simulation",
      "default": 0
    },
    "stop": {
      "type": "number",
      "description": "Stop time of simulation"
    },
    "saveat": {
      "anyOf": [
        {
          "type": "number",
          "minimum": 0
        },
        {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      ]
    },
    "dtmax": {
      "description": "Maximum time step",
      "type": "number",
      "minimum": 0
    }
  },
  "required": ["name", "model", "abstol", "reltol", "stop"]
}
```

Now developers have a choice here (we _do not_ need to prescribe this choice for
them) on how the JSON schema and the Julia `struct` are related. There are at
least three ways to approach developing this two things:

1. Independently develop both the JSON Schema and the Julia `struct`
2. Develop the Julia `struct` and then generate the JSON Schema from it
3. Develop a JSON Schema and then _generate_ the Julia `struct` from it

Let's discuss the pros and cons of each of this starting with option 1. In this
case, the burden isn't so much the effort involved in defining both the JSON
schema and the struct (both are pretty simple) but the issue is mainly in
**keeping them perfectly in sync**. Remember, one of these is supposed to be an
alternative (but equivalent) representation of the other. So it is important
that they stay in sync. One could make the reasonable argument that for an
analysis that rarely changes, it is just simpler to develop both of these
independently.

The final option is to start with the Julia `struct` and generate the JSON
schema. All things being equal, this is my personal choice (and has worked very
well for me when using tools like
[`huma`](https://github.com/danielgtaylor/huma)). However, the Julia ecosystem
doesn't quite have what we need here. **However**, this is actually almost
possible with
[`JSONSchemaGenerator.jl`](https://juliapackages.com/p/jsonschemagenerator)
today (courtesy of our friends at ASML). The only complication is the `model`
field. With a small extension to `JSONSchemaGenerator.jl` to leverage the
`julia:type` field, I think this could actually be done using just
`JSONSchemaGenerator.jl`.

The final option is to develop the JSON schema first and then generate the Julia
struct. Sadly, while there are [many transformation tools out
there](https://transform.tools/json-to-json-schema), I couldn't find anything
that transforms a JSON Schema into a Julia struct. I really don't think would
be that hard but I'm not sure it would be worth developing such a tool for this
case simply because, as pointed out previously, it really isn't that hard to
keep things in sync (at least in this case). But if you really need a "single
source of truth", it is probably better to go with the previously option and use
the Julia `struct` as the single source of truth.

### Dyad

#### Base analysis

In Dyad, the definition of an `analysis` looks like this:

```
analysis RLCTransient
  extends Transient(abstol=10m, reltol=1m, start=0, stop=10.0, dtmax=0.1)
  parameter C::Capacitance=1m
  model = RLCModel(C=C)
end
```

_Every_ analysis is defined by extending from another analysis. But if this is
the case, how do we avoid "infinite" recursion. The answer lies in the fact
that (under the new schematized analysis approach), the `Transient` analysis
would be defined as follows:

```
analysis Transient
  extends Analysis(schema="dyad://DyadBase/transient_analysis.json")
end
```

The point is that this extends from some "built-in" analysis type which is then
defined in terms of the underlying JSON schema. We can think of the "flattened"
version of `Transient` as being equivalent (conceptually...this syntax isn't
actually legal in Dyad) to the following (but this is _derived_ from the JSON
schema):

```
partial analysis Transient
  # Analysis Type
  parameter name::String="TransientAnalysis"
  parameter integrator::String="auto"
  # Absolute tolerance to use during the simulation
  parameter abstol::Real
  # Relative tolerance to use during the simulation
  parameter reltol::Real
  # Start time of simulation
  parameter start::Real=0
  # Stop time of simulation
  parameter stop::Real
  parameter saveat::Real[:] = []
  # Maximum time step
  parameter dtmax::Real
  # Name of the model to use in the analysis
  model::Component
end
```

!!!warning

Dyad doesn't have union types (although we have `enum`s which might be able to
do the job) so I've simplified `saveat` to just an array of values. We'd
probably want to update the Julia `struct` definition in a similar way. A key
point here is that (at least initially) we won't really be able to support the
fully expressiveness of JSON Schema.

!!!

In this sense, we can think of the "flattened" version of `RLCTransient` as:

```
analysis RLCTransient
  # Analysis Type
  parameter name::String="RLCTransientAnalysis"
  parameter integrator::String="auto"
  # Absolute tolerance to use during the simulation
  parameter abstol::Real=10m
  # Relative tolerance to use during the simulation
  parameter reltol::Real=1m
  # Start time of simulation
  parameter start::Real=0
  # Stop time of simulation
  parameter stop::Real=10.0
  parameter saveat::Real[:] = []
  # Maximum time step
  parameter dtmax::Real=0.1
  # Model capacitance
  parameter C::Capacitance=1m
  # Name of the model to use in the analysis
  model = RLCModel(C=C)
end
```

Note that all of this is really just conceptual since, again, this syntax isn't
really supported in Dyad. But this is to give some sense of what the
instantiation process is doing on the Dyad side. Furthermore, the schema
information (like min and max values, _etc._) will be used to perform additional
validation of the transient analysis on the Dyad side. We can think of these as
additional semantic checks that we will perform on the analyses derived from the
JSON Schema semantics.

Ultimately, this `RLCTransient` definition will be translated _back_ into Julia
code via the Dyad code generation process. I would expect this to look
something like this:

```julia
Base.@kwdef struct RLCTransientAnalysisSpec <: AbstractAnalysisSpec
    # Analysis Type
    name::Symbol
    # Integration scheme to use
    integrator::Union{Nothing,Symbol}
    # The model to simulate
    model::ODESystem
    # Absolute tolerance to use during the simulation
    abstol::Float64
    # Relative tolerance to use during the simulation
    reltol::Float64
    # Start time of simulation
    start::Union{Nothing,Float64}
    # Stop time of simulation
    stop::Float64
    saveat::Union{Nothing,Float64,AbstractVector{Float64}}
    # Maximum time step (isn't this just a band-aid for lack of events?)
    dtmax::Union{Nothing,Float64}
    # Model capacitance
    C::Float64=1m
end

function run_analysis(spec::RLCTransientAnalysisSpec)::TransientAnalysisSolution
  model = RLCModel(C=spec.C)
  transient = TransientAnalysisSpec(name=spec.name, model=model, abstol=spec.abstol, reltol=spec.reltol, start=spec.start, stop=spec.top, saveat=spec.saveat, dtmax=spec.dtmax)
  run_analysis(transient)
end
```

!!!

Note, the above is **generated** code. It really doesn't matter how messy or
complicated this code is...a human doesn't need to write it. The only concern
here is whether this interferes with potential precompilations. By marshalling
all the data (ultimately) into a `TransientAnalysisSpec` instance, it seems like
`run_analysis(::TransientAnalysisSpec)` can be precompiled. Or?

!!!

## API Considerations

In our example, we showed a JSON schema for our transient analysis. But one
thing that we need to do on the API side of things is to receive a JSON payload
(that conforms to the schema definition) and transform that into a Julia struct.

The main issue here is how to deal with information that cannot be serialized.
In this case, the `model` field is problematic. I see two options:

1. Simply don't allow changes to fields like `model` for the API. In other
   words, the API will allow us to vary any aspect of the analysis except those
   which cannot be serialized.
2. Implement some kind of scheme for deserializing string representations into
   the non-serializable Julia values through conventions or some other special
   handling.

For the purposes of this document, I'm going to assume option 1 and I think this
is reasonably well justified because, upon inspection, it turns out that API
requests will rarely actually require **any** variation.

But this requires some explanation. Consider the use case here. A user has
defined the `RLCTransient` analysis and they want to run it. Generally
speaking, they want to run it for the parameters that they've already specified.
Remember, `RLCTransient` analysis builds on the transient analysis, but it isn't
as open ended. It has everything fully specified. So the "payload" that we
might send when we request performing the `RLCTransient` analysis might be just
this:

```json
{
  "name": "RLCTransientAnalysis"
}
```

Such a request could be processed by this **automatically generated** (by the
Dyad compiler) Julia code:

```julia
StructTypes.StructType(::Type{RLCTransientAnalysisSpec}) = StructTypes.Struct()
StructTypes.defaults(::Type{RLCTransientAnalysisSpec}) = (integrator=:auto, abstol=0.01, reltol=0.001, start=0, stop=10, model=nothing, C=0.001, dtmax=0.1, saveat=())

function SolveRLCTransientAnalysis(payload::String)
    payload = JSON3.read(json_string, RLCTransientAnalysisSpec)
    payload.model = RLCModel(C=payload.C)
    run_analysis(payload)
end
```

!!!

A key point here is that the API is never asked to solve a `TransientAnalysis`.
It will only be asked to run an analysis _derived_ from a `TransientAnalysis`
and those will always have defaults for _everything_. So in this context,
everything becomes optional (except the `name`, presumable...but it is unclear
to me whether the backend endpoint already contains the name or whether the
payload itself determines the workload to be performed).

!!!

In this scheme (which, as far as I can tell, can be completely implemented today
with `JSON3`), we could override any parameter in the payload (including `C`)
except for the model itself. If a user wants to perform this same analysis on a
different model, then (in Dyad), they can just do:

```
analysis AltRLC
  extends RLCAnalysis()
  model = AltRLCModel(C=C)
end
```

Of course, with some work we could implement option 2 above. Since this is all
generated code, we don't really need to worry about how complicated it would be.
We'd just have to have a slightly more complicated process for filling in
`payload.model`.
