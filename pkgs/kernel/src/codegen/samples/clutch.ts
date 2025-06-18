export const machine_sources = {
  "clutch.dyad": `
model Clutch begin
  flange_a = Flange()
  flange_b = Flange()
  input clutchPressure::Force
  parameter cgeo::Real
  parameter omega_eps::AngularVelocity = 0.001

  variable mu::Real
  variable torque::Torque
  variable omega_rel::AngularVelocity

  initial state IsSlipping begin
  equations
    flange_a.tau = -sign(omega_rel)*torque
  end

  state IsStuck begin
  equations
    der(omega_rel) = 0
  end

equations
  mu = f(omega_rel)
  omega_rel = der(flange_a.phi) - der(flange_b.phi)
  torque = cgeo*mu*clutchPressure
  flange_a.tau + flange_b.tau = 0

transitions
  transition(IsSlipping => IsStuck, abs(omega_rel) < omega_eps)
  transition(IsStuck => IsSlipping, abs(flange_a.tau) > torque)
end
`,
};
