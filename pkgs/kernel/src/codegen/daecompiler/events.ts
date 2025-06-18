export type ModuleName = string[];

export interface TypeKey {
  kind: "type";
  module: ModuleName;
  name: string;
}

export function typeKey(module: ModuleName, name: string): TypeKey {
  return {
    kind: "type",
    module,
    name,
  };
}

export interface DefinitionKey {
  kind: "definition";
  module: ModuleName;
  name: string;
}
export function definitionKey(module: ModuleName, name: string): DefinitionKey {
  return {
    kind: "definition",
    module,
    name,
  };
}

export interface TestKey {
  kind: "test";
  module: ModuleName;
  name: string;
}
export function testKey(module: ModuleName, name: string): TestKey {
  return {
    kind: "test",
    module,
    name,
  };
}

export interface ExperimentKey {
  kind: "experiment";
  module: ModuleName;
  name: string;
}
export function experimentKey(module: ModuleName, name: string): ExperimentKey {
  return {
    kind: "experiment",
    module,
    name,
  };
}

export type CodeGenKey = TypeKey | DefinitionKey | TestKey | ExperimentKey;

export type CodeGenAspect =
  | "type"
  | "definition"
  | "experiment"
  | "test"
  | "precompilation";

export const codeGenAspects: CodeGenAspect[] = [
  "type",
  "definition",
  "experiment",
  "test",
  "precompilation",
];

export interface DAEHandler {
  /**
   * Called at the start of code generation to announce all modules that will
   * be emitted.
   **/
  modules(all: Array<ModuleName>): Promise<void>;
  /**
   * This is called for each module (in the order specified by the `modules`
   * method) before any call to `source` associated with that module.
   * @param module
   */
  startModule(module: ModuleName): Promise<void>;
  /**
   * The `preamble` method may be called for each module.  It may be called multiple
   * time.  The `component` indicates which code stream this should be injected into.
   */
  preamble(
    module: ModuleName,
    aspect: CodeGenAspect,
    code: string
  ): Promise<void>;
  /**
   * This function should be called in inject precompilation code into the module.
   * This function can be called multiple times for a given module
   * @param module
   * @param code
   */
  precompilation(module: ModuleName, code: string): Promise<void>;
  /**
   * This method is called for each entity in a given module.  Before any call
   * to this method, you can be sure that the `startModule` method has been
   * called for the module associated with this key.  Furthermore, you can be
   * sure that the `endModule` method will be called after this call (at some
   * point) for the module associated with this key.  This method may be called
   * multiple times and the code will be concatenated.  This function should be
   * called at most one time.
   */
  source(key: CodeGenKey, code: string): Promise<void>;
  /**
   * This is called for each module (in the order specified by the `modules`
   * moethod) after all calls to `source` associated with that module.
   * @param module
   */
  endModule(module: ModuleName): Promise<void>;
  /**
   * This method is called exactly once at the end of the code generation
   * process. It returns a promise in order to allow the handler to complete any
   * async operations required to store the results.
   */
  close(): Promise<void>;
}
