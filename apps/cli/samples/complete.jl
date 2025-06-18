using ModelingToolkit
using DifferentialEquations
using Plots
using Unitful

@variables t [unit = u"s"]
D = Differential(t)

@connector Pin begin
    v(t), [unit = u"V"]
    i(t), [connect = Flow, unit = u"A"]
end

@mtkmodel Ground begin
    @components begin
        g = Pin()
    end
    @equations begin
        g.v ~ 0
    end
end

@mtkmodel TwoPin begin
    @components begin
        p = Pin()
        n = Pin()
    end
    @variables begin
        v(t), [unit = u"V"]
        i(t), [unit = u"A"]
    end
    @equations begin
        v ~ p.v - n.v
        0 ~ p.i + n.i
        i ~ p.i
    end
end

@mtkmodel Resistor begin
    @extend v, i = twopin = TwoPin()
    @parameters begin
        R, [unit = u"Ω"]
    end
    @equations begin
        v ~ i * R
    end
end

@mtkmodel Capacitor begin
    @extend v, i = twopin = TwoPin()
    @parameters begin
        C, [unit = u"F"]
    end
    @equations begin
        C * D(v) ~ i
    end
end

@mtkmodel Inductor begin
    @extend v, i = twopin = TwoPin()
    @parameters begin
        L, [unit = u"H"]
    end
    @equations begin
        L * D(i) ~ v
    end
end

@mtkmodel ConstantVoltage begin
    @extend (v,) = twopin = TwoPin()
    @parameters begin
        V, [unit = u"V"]
    end
    @equations begin
        V ~ v
    end
end

@mtkmodel RLCModel begin
    @components begin
        resistor = Resistor(R=100.0)
        capacitor = Capacitor(C=1.0e-3)
        inductor = Inductor(L=1.0)
        source = ConstantVoltage(V=24.0)
        ground = Ground()
    end
    @equations begin
        connect(source.p, inductor.p)
        connect(inductor.n, resistor.p)
        connect(inductor.n, capacitor.p)
        connect(resistor.n, ground.g)
        connect(capacitor.n, ground.g)
        connect(source.n, ground.g)
    end
end

@mtkbuild rlc_model = RLCModel()
u0 = [
    rlc_model.capacitor.v => 0.0,
    rlc_model.inductor.i => 0.0
]
prob = ODEProblem(rlc_model, u0, (0, 1.0))
sol = solve(prob)
display(plot(sol, idxs=[rlc_model.capacitor.v, rlc_model.inductor.i]))