export interface PackageEntry {
  uuid: string;
  compat?: string;
  appliesTo?: string[];
}

export const defaultPackages: Record<string, PackageEntry> = {
  // DiffEqDevTools: {
  //   uuid: "f3b72e0c-5b89-59e1-b016-84e28bfd966d",
  //   compat: "=2.44.2",
  // },
  DyadEcosystemDependencies: {
    uuid: "7bc808db-8006-421e-b546-062440d520b7",
    compat: "=0.9.4",
  },
  Markdown: {
    uuid: "d6f4376e-aef5-505a-96c1-9c027394607a",
    compat: "1",
  },
  DyadInterface: {
    uuid: "99806f68-afab-45ca-9d8c-ceff6bc61f54",
  },
  ModelingToolkit: {
    uuid: "961ee093-0014-501f-94e3-6117800e7a78",
  },
  OrdinaryDiffEqDefault: {
    uuid: "50262376-6c5a-4cf5-baba-aaf4f84d72d7",
  },
  PrecompileTools: {
    uuid: "aea7be01-6a6a-4083-8856-8a6e6704d82a",
  },
  RuntimeGeneratedFunctions: {
    uuid: "7e49a35a-f44a-4d26-94aa-eba1b4ca6b47",
  },
  // DAECompiler: {
  //   uuid: "32805668-c3d0-42c2-aafd-0d0a9857a104",
  //   compat: "=1.21.0",
  // },
  // SciMLBase: {
  //   uuid: "0bca4576-84f4-4d90-8ffe-ffa030f20462",
  //   compat: "=2.60.0",
  // },
  // OrdinaryDiffEq: {
  //   uuid: "1dea7af3-3e70-54e6-95c3-0bf5283fa5ed",
  //   compat: "=6.87.0",
  // },
  //
  // test time dependencies
  CSV: { uuid: "336ed68f-0bac-5ca0-87d4-7b16caf5d00b", appliesTo: ["test"] },
  DataFrames: {
    uuid: "a93c6f00-e57d-5684-b7b6-d8193f3e46c0",
    appliesTo: ["test"],
  },
  Plots: { uuid: "91a5bcdd-55d7-5caf-9e0b-520d859cae80", appliesTo: ["test"] },
  Test: { uuid: "8dfed614-e22c-5e08-85e1-65c5234f0b40", appliesTo: ["test"] },
};

export const defaultContents: Record<string, string> = {
  "hello.dyad": `# A simple lumped thermal model
component Hello
  # Ambient temperature
  parameter T_inf::Temperature = 300
  # Initial temperature
  parameter T0::Temperature = 320
  # Convective heat transfer coefficient
  parameter h::CoefficientOfHeatTransfer = 0.7
  # Surface area
  parameter A::Area = 1.0
  # Mass of thermal capacitance
  parameter m::Mass = 0.1
  # Specific Heat
  parameter c_p::SpecificHeatCapacity = 1.2
  variable T::Temperature
relations
  # Specify initial conditions
  initial T = T0
  # Newton's law of cooling/heating
  m*c_p*der(T) = h*A*(T_inf-T)
metadata {"Dyad": {"tests": {"case1": {"stop": 10, "expect": {"initial": {"T": 320}}}}}}
end

analysis World
  extends TransientAnalysis(stop=10)
  model = Hello(T_inf=T_inf, h=h)
  parameter T_inf::Temperature = 300
  parameter h::CoefficientOfHeatTransfer = 0.7
end
`,
};
