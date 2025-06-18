using ModelingToolkit
using ModelingToolkit: t_nounits as t
using ModelingToolkit: D_nounits as D
using OrdinaryDiffEq
using Plots

function System(reg_pow; name)
    pars = @parameters begin
        rho_0 = 1000
        beta = 2e9
        A = 0.1
        m = 100
        L = 1

        p_s = 10e5
        p_r = 10e5
        C = 1.35
        c = 1000
        A_p = 0.00094

        transition = 0.1
    end
    vars = @variables begin
        p_1(t) = 100e5
        p_2(t) = 100e5
        x(t) = 0
        dx(t) = 0
        ddx(t), [guess = 0]
        rho_1(t), [guess = rho_0]
        rho_2(t), [guess = rho_0]
        drho_1(t), [guess = 0]
        drho_2(t), [guess = 0]
        dm_1(t), [guess = 0]
        dm_2(t), [guess = 0]
        u_1(t), [guess = 0]
        u_2(t), [guess = 0]
    end

    eqs = [
        D(x) ~ dx
        D(dx) ~ ddx
        D(rho_1) ~ drho_1
        D(rho_2) ~ drho_2
        u_1 ~ dm_1 / (rho_0 * A_p)
        u_2 ~ dm_2 / (rho_0 * A_p)
        +dm_1 ~ drho_1 * (L + x) * A + rho_1 * dx * A
        -dm_2 ~ drho_2 * (L - x) * A - rho_2 * dx * A
        rho_1 ~ rho_0 * (1 + p_1 / beta)
        rho_2 ~ rho_0 * (1 + p_2 / beta)
        m * ddx ~ (p_1 - p_2) * A - c * dx
        (p_s - p_1) ~ C * rho_0 * reg_pow(u_1, 2, transition)
        (p_2 - p_r) ~ C * rho_0 * reg_pow(u_2, 2, transition)
    ]
    return ODESystem(eqs, t, vars, pars; name)
end

# This is an attempt to undo the manual index reduction.  But so far,
# it doesn't give the same results so there must be an error here...
# so ignore this.
function AltSystem(reg_pow; name)
    pars = @parameters begin
        rho_0 = 1000
        beta = 2e9
        A = 0.1
        m = 100
        L = 1

        p_s = 10e5
        p_r = 10e5
        C = 1.35
        c = 1000
        A_p = 0.00094

        transition = 0.1
    end
    vars = @variables begin
        p_1(t) = 100e5
        p_2(t) = 100e5
        x(t) = 0
        dx(t) = 0
        ddx(t), [guess = 0]
        rho_1(t), [guess = rho_0]
        rho_2(t), [guess = rho_0]
        drho_1(t), [guess = 0]
        drho_2(t), [guess = 0]
        m_1(t),
        m_2(t),
        u_1(t), [guess = 0]
        u_2(t), [guess = 0]
    end

    eqs = [
        D(x) ~ dx
        D(dx) ~ ddx
        u_1 ~ D(m_1) / (rho_0 * A_p)
        u_2 ~ D(m_2) / (rho_0 * A_p)
        m_1 ~ rho_1 * (L + x) * A
        m_2 ~ rho_2 * (L - x) * A
        rho_1 ~ rho_0 * (1 + p_1 / beta)
        rho_2 ~ rho_0 * (1 + p_2 / beta)
        m * ddx ~ (p_1 - p_2) * A - c * dx
        (p_s - p_1) ~ C * rho_0 * reg_pow(u_1, 2, transition)
        (p_2 - p_r) ~ C * rho_0 * reg_pow(u_2, 2, transition)
    ]
    return ODESystem(eqs, t, vars, pars; name)
end

function naive(x, order, delta)
    sign(x) * abs(x)^order
end

@mtkbuild sysn = System(naive)
probn = ODEProblem(sysn, [], (0, 0.02))
soln = solve(probn, Rodas5P())

function reg_linear(delta)
    function reg_linear(x, order, ignored)
        ifelse(abs(x) > delta, sign(x) * abs(x)^order, x / delta * delta^order)
    end
end

function solve_linear(delta, tend)
    f = reg_linear(delta)
    @mtkbuild sys = System(f)
    prob = ODEProblem(sys, [], (0, tend))
    sol = solve(prob, Rodas5P())
    b = @benchmark solve($prob, Rodas5P())
    (sys, sol, u -> f(u, 2, 1), b)
end

tend = 0.2
(sysl, soll, fl, bl) = solve_linear(0.5, tend);
(syslh, sollh, flh, bh) = solve_linear(20, tend);
(sysl1, soll1, fl1, bl1) = solve_linear(1, tend);

function build_smooth(delta, df0)
    c = df0
    a = df0 / (3 * delta - 2 * delta^2)
    b = 1 - df0 / (3 - 2 * delta) - df0 / delta
    function reg_smooth(x, order, ignored)
        ifelse(abs(x) > delta, abs(x) * x, a * x^3 + b * abs(x) * x + c * x)
    end
end

function solve_smooth(delta, df0, tend)
    f = build_smooth(delta, df0)
    @mtkbuild sys = System(f)
    prob = ODEProblem(sys, [], (0, tend))
    sol = solve(prob, Rodas5P())
    b = @benchmark solve($prob, Rodas5P())
    (sys, sol, u -> f(u, 2, 1), b)
end

function alt_solve_smooth(delta, df0, tend)
    f = build_smooth(delta, df0)
    @mtkbuild sys = AltSystem(f)
    prob = ODEProblem(sys, [], (0, tend))
    sol = solve(prob, Rodas5P())
    b = @benchmark solve($prob, Rodas5P())
    (sys, sol, u -> f(u, 2, 1), b)
end

(syss0, sols0, fs0, bs0) = solve_smooth(0.5, 0.5, tend);
(syss1, sols1, fs1, bs1) = solve_smooth(1, 1, tend);
(syss2, sols2, fs2, bs2) = solve_smooth(0.5, 0.1, tend);
(syssh, solsh, fsh, bsh) = solve_smooth(20, 20, tend);
(syssha, solsha, fsha, bsha) = alt_solve_smooth(20, 20, tend);

plot(x, fs0, label="Cubic, df0 = 0.5")
plot!(x, fs1, label="Cubic, df0 = 0.25")
plot!(x, fl, label="Linear")
plot!(x, u -> abs(u) * u, label="Quadratic")

plot(sollh, idxs=[syslh.rho_1], label="Linear, delta=20")
plot!(solsh, idxs=[syssh.rho_1], label="Cubic, delta=20")
plot!(solsha, idxs=[syssha.rho_1], label="Alt Cubic, delta=20")
plot!(sols1, idxs=[syss1.rho_1], label="df0 = 0.25")
plot!(sols2, idxs=[syss2.rho_1], label="df0 = 0.1")
plot!(soll1, idxs=[sysl1.rho_1], label="Linear, 1")
plot!(sollh, idxs=[syslh.rho_1], label="Linear, 40")
# @mtkbuild sys0 = System(reg_pow0)
# @mtkbuild sys1 = System(reg_pow1)
# @mtkbuild sys2 = System(reg_pow2)


# prob0 = ODEProblem(sys0, [], (0, 0.02))
# prob1 = ODEProblem(sys1, [], (0, 0.02))
# prob2 = ODEProblem(sys2, [], (0, 0.02))

# sol0 = solve(prob0, Rodas5P()) # Unstable
# sol1 = solve(prob1, Rodas5P()) # Unstable
# sol2 = solve(prob2, Rodas5P()) # Success

plot(sollh, idxs=[syslh.p_1], label="p_1 - Linear, delta=20")
plot!(sollh, idxs=[syslh.p_2], label="p_2 - Linear, delta=20")
plot!(solsh, idxs=[syssh.p_1], label="p_1 - Cubic, delta=20")
plot!(solsh, idxs=[syssh.p_1], label="p_2 - Cubic, delta=20")
