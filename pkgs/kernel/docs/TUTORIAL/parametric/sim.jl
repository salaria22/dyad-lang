using ModelingToolkit
using ModelingToolkit: t_nounits as t, D_nounits as D
using OrdinaryDiffEq
using Plots

function transition(x1, x2, y1, y2, x)
    u = (x - x1) / (x2 - x1)
    blend = u^2 * (3 - 2 * u)
    return (1 - blend) * y1 + blend * y2
end

liquid_density(p, rho_0, beta) = rho_0 * (1 + p / beta)

full_density(p, rho_0, rho_gas, beta, p_0, p_gas) = ifelse(p > p_0, liquid_density(p, rho_0, beta), transition(p_0, p_gas, rho_0, rho_gas, p))

function System(; name)
    pars = @parameters begin
        rho_0 = 1000

        p_0 = 0
        p_gas = -1000

        rho_gas = 1
        beta = 2e9
        A = 0.1
        m = 100
        L = 0.01

        C = 1.35
        c = 1000

        force = 3e5
    end
    vars = @variables begin
        p_1(t)
        p_2(t)
        x(t) = 0
        dx(t) = 0
        s_1(t) = 10e5, [guess = 1000]
        s_2(t) = 10e5, [guess = 1000]
        V_v1(t)
        V_v2(t)
        V_1(t)
        V_2(t)
        ddx(t), [guess = 0]
        rho_1(t), [guess = rho_0]
        rho_2(t), [guess = rho_0]
        m_1(t), [guess = 0]
        m_2(t), [guess = 0]
    end

    eqs = [
        D(x) ~ dx
        D(dx) ~ ddx
        V_1 ~ (L + x) * A
        V_2 ~ (L - x) * A
        m_1 ~ rho_1 * (V_1 - V_v1)
        m_2 ~ rho_2 * (V_2 - V_v2)
        rho_1 ~ liquid_density(p_1, rho_0, beta)
        rho_2 ~ liquid_density(p_2, rho_0, beta)
        p_1 ~ ifelse(s_1 < 0, 0, s_1)
        p_2 ~ ifelse(s_2 < 0, 0, s_2)
        V_v1 ~ ifelse(s_1 < 0, -s_1, 0)
        V_v2 ~ ifelse(s_2 < 0, -s_2, 0)
        m * ddx ~ (p_1 - p_2) * A - c * dx + force * sin(2 * pi * t / 0.01)
        D(m_1) ~ 0
        D(m_2) ~ 0
    ]

    return ODESystem(eqs, t, vars, pars; name)
end

@mtkbuild sys = System()
prob = ODEProblem(sys, [], (0, 0.02))

sol = solve(prob, ImplicitEuler(nlsolve=NLNewton(relax=0.1, always_new=true)))