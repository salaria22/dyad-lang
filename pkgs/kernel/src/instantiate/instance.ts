import { ASTNode } from "@juliacomputing/dyad-ast";
import { ComponentInstance } from "./component.js";
import {
  ConnectorElementInstance,
  ConnectorInstance,
  ScalarConnectorInstance,
  StructConnectorInstance,
} from "./connector.js";
import { ConstantInstance } from "./constants.js";
import { ModelInstance } from "./model.js";
import { VariableInstance } from "./variable.js";
import { Either, Left, Right } from "purify-ts/Either";
import { assertUnreachable, Problem } from "@juliacomputing/dyad-common";
import { UnimplementedError } from "../workspace/errors.js";
import { Workspace } from "../workspace/workspace.js";

export type Instance =
  | ModelInstance
  | ComponentInstance
  | ConnectorInstance
  | VariableInstance
  | ConstantInstance
  | ConnectorElementInstance;

export function isModelInstance(x: Instance): x is ModelInstance {
  return x.kind === "model";
}

export function isComponentInstance(x: Instance): x is ComponentInstance {
  return x.kind === "comp";
}

export function isScalarConnectorInstance(
  x: Instance
): x is ScalarConnectorInstance {
  return x.kind === "sclcon";
}

export function isRecordConnectorInstance(
  x: Instance
): x is StructConnectorInstance {
  return x.kind === "strcon";
}

export function isVariableInstance(x: Instance): x is VariableInstance {
  return x.kind === "vari";
}

export function isConnectorElementInstance(
  x: Instance
): x is ConnectorElementInstance {
  return x.kind === "cvari";
}

export function isConstantInstance(x: Instance): x is ConstantInstance {
  return x.kind === "con";
}

export function instanceContext(
  x: Instance,
  workspace: Workspace
): Either<Problem<unknown>, ASTNode> {
  switch (x.kind) {
    case "model":
      return Right(workspace.query(x.def));
    case "comp":
      return Right(workspace.query(x.instance.def));
    case "sclcon":
    case "strcon":
      return Right(x.def);
    case "con":
    case "vari":
    case "cvari":
      return Left(
        new UnimplementedError(
          `instanceContext`,
          `Extracting context node from instance of type ${x.kind} currently not supported`
        )
      );
    default:
      assertUnreachable(x);
  }
}
