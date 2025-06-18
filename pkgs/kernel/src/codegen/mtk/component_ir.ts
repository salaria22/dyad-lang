import { Nullable } from "@juliacomputing/dyad-common";

/**
 * This represents all the information that needs to be rendered for an MTK
 * component.  But the key point here is to have all the business logic
 * separated from the code generation.  So this structure represents the
 * information needed for rendering *after* all the business logic has been
 * applied.  The goal here is to avoid tortured templates for code generation
 * and, instead, keep them quite simple and straightforward to read.
 */
export interface ComponentIR {
  /**
   * Comments that precede the MTK function
   */
  comment: Nullable<string>;
  /**
   * Doc string that precedes the MTK constructor function
   */
  doc_string: Nullable<string>;
  /** Name of the function to emit */
  function_name: string;
  /**
   * Positional arguments for the MTK constructor function
   */
  positional_arguments: string[];
  /**
   * Keyword arguments for the MTK constructor function
   */
  keyword_arguments: Record<string, string>;
  /**
   * Assertions involving only structural parameters
   */
  structural_assertions: Array<AssertionIR>;
  /**
   * Assertions involving symbolic parameters
   */
  parameter_assertions: Array<AssertionIR>;
  /**
   * Information about temporary variables that need to be defined.  Also, the
   * order of the elements in the array should match their evaluation order.
   */
  temporary_variables: Array<MappingIR>;
  /**
   * Parameter declarations that belong in the `@structural_parameters` section
   */
  structural_parameters: Array<VariableDeclarationIR>;
  /**
   * Parameter declarations that belong in the `@parameters` section
   */
  symbolic_parameters: Array<VariableDeclarationIR>;
  /**
   * Declarations that belong in the `@variables` section
   */
  symbolic_variables: Array<VariableDeclarationIR>;
  /**
   * Declarations that belong in the `@constants` section
   */
  symbolic_constants: Array<VariableDeclarationIR>;
  /**
   * The system of components associated with this Dyad component
   */
  system: Array<ComponentDeclarationIR>;
  /**
   * Default values to assign
   */
  defaults: Array<MappingIR>;
  /**
   * Equations that must be true (only) during initialization
   */
  initialization_equations: Array<EquationIR>;
  /**
   * Equations that must be true always
   */
  equations: Array<EquationIR>;
  /**
   * Connection statements
   */
  connections: Array<ConnectionIR>;
}

export interface ComponentDeclarationIR {
  doc_string: string;
}

export interface VariableDeclarationIR {
  doc_string: string;
}

/**
 * Information required for assertions.
 */
export interface AssertionIR {
  doc_string: string;
  expr: string;
  message: string;
}

/**
 * In some cases, we wish to evaluate expressions and assign them to dictionary
 * keys or temporary variables.  This is the information about the expressions
 * we are going to evaluate and what name to give them.
 */
export interface MappingIR {
  name: string;
  value: string;
}

/**
 * Representation of equations
 */
export interface EquationIR {
  doc_string: string;
  lhs: string;
  rhs: string;
}

/**
 * IR for connection statements
 */
export interface ConnectionIR {
  doc_string: string;
  c1: string;
  c2: string;
}
