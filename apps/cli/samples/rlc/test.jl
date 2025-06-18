using Pkg

Pkg.activate(".")
using Revise

using Plots
using DifferentialEquations
using ModelingToolkit
using Unitful

# Unitful.promote_to_derived()

include("./src/RLC.jl")

function simulate()
    @mtkbuild rlc_model = RLCModel()

    u0 = [
        rlc_model.capacitor.v => 0.0,
        rlc_model.inductor.i => 0.0
    ]
    prob = ODEProblem(rlc_model, u0, (0, 1.0))
    sol = solve(prob)
    display(plot(sol, idxs=[rlc_model.capacitor.v, rlc_model.inductor.i]))
end

function testdiode()
    @mtkbuild test = TestDiode()

    u0 = []
    prob = ODEProblem(test, u0, (0, 3.0))
    sol = solve(prob)
    display(plot(sol, idxs=[test.diode.s, test.diode.v, test.diode.i]))
end

# testdiode()
simulate()