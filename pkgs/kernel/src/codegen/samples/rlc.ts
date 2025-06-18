export const rlc_sources: Record<string, string> = {
  "types.dyad": `
  type Voltage = Real(units="V")
  type Current = Real(units="A", guess=0.1)
  type Resistance = Real(units="Ω", min=0)
  type Capacitance = Real(units="F", min=0)
  type Inductance = Real(units="H", min=0)
      `,
  "pin.dyad": `connector Pin
    potential v::Voltage [{ "Dyad": { "tags": ["electrical"] } }]
    flow i::Current
    metadata {
      "Dyad": {
          "icons": { "pos": "dyad://RLC/p_pin.svg", "neg": "dyad://RLC/n_pin.svg" },
          "path": { "stroke": "blue" }
      }
    }
  end
  `,
  "ground.dyad": `
component Ground
  g = Pin() [
    { "Dyad": { "placement": { "icon": { "iconName": "pos", "x1": 900, "y1": 400, "x2": 1100, "y2": 600 } } } }
  ]
relations
  g.v = 0
end
`,
  "twopin.dyad": `
partial component TwoPin
  p = Pin() [{ "Dyad": { "placement": { "icon": { "iconName": "pos", "x1": -100, "y1": 400, "x2": 100, "y2": 600 } } } }]
  n = Pin() [{ "Dyad": { "placement": { "icon": { "iconName": "neg", "x1": 900, "y1": 400, "x2": 1100, "y2": 600, "rot": 90 } } } }]
  variable v::Voltage
  variable i::Current
relations
  v = p.v - n.v
  i = p.i
  p.i + n.i = 0
end
`,
  "source.dyad": `
component CurrentSource 
  extends TwoPin()
  parameter i_final::Current
  final parameter i_f::Current = i_final
relations
  i = i_final
end

component VoltageStep
  extends TwoPin()
  parameter Vf::Voltage = 10
relations
  src: v = if time<0 then 0 elseif time>5 then 7 else Vf
end

component VoltageSource 
  extends TwoPin()
  V = RealInput()
relations 
  v = V
end

component VoltagePulse
  extends TwoPin
  parameter Vbase::Voltage
  parameter Vpulse::Voltage
  parameter start::Time
  parameter stop::Time
relations
  v = if time>start and time<stop then Vpulse else Vbase
end
`,
  "capacitor.dyad": `
component Capacitor
  extends TwoPin()
  parameter C::Capacitance
relations
  initial v = 10
  C * der(v) = i
end
`,
  "inductor.dyad": `
component Inductor
  extends TwoPin()
  parameter L::Inductance
relations
  L * der(i) = v
end
`,
  "resistor.dyad": `
# A simple linear resistor model
component Resistor
  extends TwoPin()

  # Resistance of this Resistor
  parameter R::Resistance
relations
  # Ohm's Law
  v = i * R
metadata {
    "Dyad": {
      "labels": [{ "label": "R=100", "x": 500, "y": 500, "attrs": { "fill": "red" } }],
      "icon": "model:./assets/resistor.svg"
    }  
}
end
`,
  "analysis.dyad": `analysis RLCTransient
  extends TransientAnalysis(abstol=10m, reltol=1m, start=0, stop=10.0, dtmax=0.1)
  parameter C::Capacitance=1m
  model = RLCModel(C=C)
end`,
  "systems.dyad": `
struct RLCModelParams
  R::Resistance(min=10,max=20) = 15
  C::Capacitance = 1m
  L::Inductance = 1
end

# This is an RLC model.  This should support markdown.  That includes
# HTML as well.
component RLCModel
  resistor = Resistor(R=100) [
      { "Dyad": { "placement": { "icon": { "x1": 700, "y1": 400, "x2": 900, "y2": 600, "rot": 90 } } } }
    ]
  capacitor = Capacitor(C=1m) [
      { "Dyad": { "placement": { "icon": { "x1": 400, "y1": 400, "x2": 600, "y2": 600, "rot": 90 } } } }
    ]
  inductor = Inductor(L=1) [
      { "Dyad": { "placement": { "icon": { "x1": 200, "y1": 100, "x2": 400, "y2": 300 } } } }
    ]
    source::TwoPin = VoltageStep(Vf=24) [
      { "Dyad": { "placement": { "icon": { "x1": 0, "y1": 400, "x2": 200, "y2": 600, "rot": 90 } } } }
    ]
  ground = Ground() [
      { "Dyad": { "placement": { "icon": { "x1": 400, "y1": 900, "x2": 600, "y2": 1100 } } } }
    ]
relations
  initial capacitor.v = 0;
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
  
component RLCModel2
  extends RLCModel(source = CurrentSource(i_final=1.5m))
end
`,
};

export const rlc_modelica_results: Record<string, string> = {
  Voltage: `type Voltage = Real(unit="V");`,
  Current: `type Current = Real(unit="A");`,
  Resistance: `type Resistance = Real(unit="Ω");`,
  Capacitance: `type Capacitance = Real(unit="F");`,
  Inductance: `type Inductance = Real(unit="H");`,
  Pin: `connector Pin
  Voltage v;
  flow Current i;
end Pin;`,
  Ground: `model Ground
  Pin g;
equation
  g.v = 0;
end Ground;`,
  CurrentSource: `model CurrentSource
  parameter Current i_final;
  final parameter Current i_f = i_final;
  Pin p;
  Pin n;
  Voltage v;
  Current i;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  i = i_final;
end CurrentSource;`,
  VoltageStep: `model VoltageStep
  parameter Voltage Vf = 10;
  Pin p;
  Pin n;
  Voltage v;
  Current i;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  v = if time < 0 then 0 else if time > 5 then 7 else Vf;
end VoltageStep;`,
  VoltageSource: `model VoltageSource
  Pin p;
  Pin n;
  RealInput V;
  Voltage v;
  Current i;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  v = V;
end VoltageSource;`,
  VoltagePulse: `model VoltagePulse
  parameter Voltage Vbase;
  parameter Voltage Vpulse;
  parameter Time start;
  parameter Time stop;
  Pin p;
  Pin n;
  Voltage v;
  Current i;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  v = if time > start and time < stop then Vpulse else Vbase;
end VoltagePulse;`,
  Capacitor: `model Capacitor
  parameter Capacitance C;
  Pin p;
  Pin n;
  Voltage v;
  Current i;
initial equation
  v = 10;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  C * der(v) = i;
end Capacitor;`,
  Inductor: `model Inductor
  parameter Inductance L;
  Pin p;
  Pin n;
  Voltage v;
  Current i;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  L * der(i) = v;
end Inductor;`,
  Resistor: `model Resistor "A simple linear resistor model"
  parameter Resistance R;
  Pin p;
  Pin n;
  Voltage v;
  Current i;
equation
  v = p.v - n.v;
  i = p.i;
  p.i + n.i = 0;
  v = i * R "Ohm's Law";
end Resistor;`,
  RLCModel: `model RLCModel "This is an RLC model.  This should support markdown.  That includes HTML as well."
  Resistor resistor(R=100);
  Capacitor capacitor(C=0.001);
  Inductor inductor(L=1);
  VoltageStep source(Vf=24);
  Ground ground();
initial equation
  capacitor.v = 0;
equation
  connect(source.p, inductor.p);
  connect(inductor.n, resistor.p);
  connect(resistor.p, capacitor.p);
  connect(resistor.n, ground.g);
  connect(ground.g, capacitor.n);
  connect(capacitor.n, source.n);
end RLCModel;`,
  RLCModel2: `model RLCModel2
  Resistor resistor(R=100);
  Capacitor capacitor(C=0.001);
  Inductor inductor(L=1);
  CurrentSource source(i_final=0.0015);
  Ground ground();
initial equation
  capacitor.v = 0;
equation
  connect(source.p, inductor.p);
  connect(inductor.n, resistor.p);
  connect(resistor.p, capacitor.p);
  connect(resistor.n, ground.g);
  connect(ground.g, capacitor.n);
  connect(capacitor.n, source.n);
end RLCModel2;`,
};

export const posElectricalPin = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000"
shape-rendering="geometricPrecision" text-rendering="geometricPrecision" transform-origin="center center">
<rect rx="0" ry="0" width="1000" height="1000" fill="#d2dbed" stroke="blue" stroke-width="8"
    vector-effect="non-scaling-stroke"></rect>
</svg>`;

export const negElectricalPin = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000"
shape-rendering="geometricPrecision" text-rendering="geometricPrecision" transform-origin="center center">
<rect rx="0" ry="0" width="1000" height="1000" fill="blue" stroke="blue" stroke-width="8"
    vector-effect="non-scaling-stroke"></rect>
</svg>`;
