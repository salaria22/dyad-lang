export const projectConsumer = `
name="Consumer"
uuid="abc123-consumer"
version="0.1.0"
authors=["Michael M. Tiller <michael.tiller@juliahub.com>"]`;

export const consumer_sources: Record<string, string> = {
  "system.dyad": `
# This is an RLC model.  This should support markdown.  That includes
# HTML as well.
component RLCModel
  resistor = RLC.Resistor(R=100) [
      { "Dyad": { "placement": { "icon": { "x1": 700, "y1": 400, "x2": 900, "y2": 600, "rot": 90 } } } }
    ]
  capacitor = RLC.Capacitor(C=1m) [
      { "Dyad": { "placement": { "icon": { "x1": 400, "y1": 400, "x2": 600, "y2": 600, "rot": 90 } } } }
    ]
  inductor = RLC.Inductor(L=1) [
      { "Dyad": { "placement": { "icon": { "x1": 200, "y1": 100, "x2": 400, "y2": 300 } } } }
    ]
    source::TwoPin = RLC.VoltageStep(Vf=24) [
      { "Dyad": { "placement": { "icon": { "x1": 0, "y1": 400, "x2": 200, "y2": 600, "rot": 90 } } } }
    ]
  ground = RLC.Ground() [
      { "Dyad": { "placement": { "icon": { "x1": 400, "y1": 900, "x2": 600, "y2": 1100 } } } }
    ]
relations
  connect(source.p, inductor.p) [{
    "Dyad": {
        "edges": [
          { "S": 1, "M": [{"x": 100, "y": 200}], "E": 2}
        ]
    }
  }]
  connect(inductor.n, resistor.p, capacitor.p) [{
    "Dyad": {
        "edges": [
          { "S": 1, "M": [{"x": 500, "y": 200}, {"x": 800, "y":200}], "E": 2}
        ]
    }
  }]
  connect(resistor.n, ground.g, capacitor.n, source.n) [{
    "Dyad": {
        "edges": [
          { "S": 1, "M": [{"x": 100, "y": 800}, {"x": 500, "y": 800}], "E": 2 },
          { "S": 2, "M": [{"x": 500, "y": 800}], "E": 3 },
          { "S": 3, "M": [{"x": 800, "y": 800}, {"x": 500, "y": 800}], "E": 4 }
        ],
        "junctions": [
          { "x": 500, "y": 800 }
    ]
    }
  }]
metadata {
  "Dyad": {
    "experiments": {
      "simple": { "start": 0, "stop": 10.0 }
    },
    "tests": {
      "case1": {
        "stop": 10,
        "atol": {
          "t": 1e-12
        },
        "initial": {
          "t": 0,
          "capacitor.v": 10
        },
        "final": {
          "t": 10.0
        }
      }
    }
  }
}  
end
`,
};
