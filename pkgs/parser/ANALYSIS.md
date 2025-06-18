```
analysis XYZ
  type: inverse_problem
  parameter x0::Real(min=0, max=10)
  simple = FirstOrder:simple
  other = FirstOrder(x0=x0)
  otherother = Pendulum(L=10)

  minimize 0.5*simple.x + 10*other.x + 200*otherother.v
end

experiment simple
  extends FirstOrder()

  solve(...)
  problem(...)
end

model FirstOrder begin
  parameter x0::Real(min=0, max=100)
  variable x::Real
initial equations
  x = x0
equations
  der(x) = -x
  x > 0
metadata {
  "Dyad": {
    "optimizations": {
      "experiments": {
        "simple": { "weight": 0.5 },
        "other": { "weight": 10 }
      },
      "bounds": {
        "x": [0, 10]
      }
    },
    "experiments": {
      "simple": { "start": 0, "stop": 10.0, "params": { "x0": 10 }, "problem": { "jac": true }, "solve": { "tol": 0.001 } }
    },
    "tests": {
      "case1": {
        "stop": 10,
        "params": {
           "x0": 10
        },
        "atol": {
          "x": 0.001
        },
        "expect": {
          "initial": { "x": 10 },
          "final": { "x": 0 },
          "traj": ["x"]
        }
      }
    }
  }
}
end
```
