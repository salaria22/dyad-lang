import { componentDeclaration } from "./nodes/component_declaration.js";
import {
  structConnectorDefinition,
  isConnectorDefinition,
} from "./nodes/connector.js";
import { isDeclaration } from "./nodes/declaration.js";
import { builtinTypes } from "./nodes/builtins.js";
import {
  isVariableDeclaration,
  variableDeclaration,
} from "./nodes/variable.js";
import { qualifiedType } from "./nodes/qualifier.js";
import { createToken } from "./nodes/token.js";

describe("Test various predicates and constructors", () => {
  /** Create a simple (empty) connector definition */
  const con = structConnectorDefinition(
    createToken("Pin", null),
    {},
    null,
    null,
    null,
    null
  );
  /** Create a simple component declaration */
  const comp = componentDeclaration(
    createToken("comp", null),
    builtinTypes[0],
    qualifiedType([createToken("Real", null)], {}, null),
    [],
    [],
    null,
    null,
    null,
    null
  );
  /** Create a simple variable declaration */
  const v = variableDeclaration(
    createToken("v", null),
    builtinTypes[0],
    [],
    null,
    false,
    null,
    "parameter",
    null,
    null,
    null
  );
  test("Test isConnector", () => {
    /** Test the `isConnectorDefinition` predicate */
    expect(isConnectorDefinition(con)).toBe(true);
    expect(isConnectorDefinition(comp)).toBe(false);
    expect(isConnectorDefinition(v)).toBe(false);
  });
  test("Test isDeclaration", () => {
    /** Test the `isDeclaration` predicate */
    expect(isDeclaration(con)).toBe(false);
    expect(isDeclaration(comp)).toBe(true);
    expect(isDeclaration(v)).toBe(true);
  });
  test("Test isVariableDeclaration", () => {
    /** Test the `isVariableDeclaration` predicate */
    expect(isVariableDeclaration(con)).toBe(false);
    expect(isVariableDeclaration(comp)).toBe(false);
    expect(isVariableDeclaration(v)).toBe(true);
  });
});
