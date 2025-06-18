import { ProblemSpan, TextProblem } from "@juliacomputing/dyad-ast";
import { z } from "zod";

/* istanbul ignore next @preserve */
export function zodIssue2Problem(context: string, schema: string) {
  return (issue: z.ZodIssue, span: ProblemSpan): TextProblem => {
    let title = "Zod Issue";
    let instance = "";
    let extra: any = {};
    switch (issue.code) {
      case "custom":
        title = "Custom Zod Type";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = issue.params;
        break;
      case "invalid_arguments":
        title = "Invalid Arguments";
        instance = issue.path.map((x) => x.toString()).join(".");
        break;
      case "invalid_date":
        title = "Invalid Date";
        instance = issue.path.map((x) => x.toString()).join(".");
        break;
      case "invalid_enum_value":
        title = "Invalid Enum Value";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { options: issue.options };
        break;
      case "invalid_intersection_types":
        title = "Invalid Intersection Types";
        instance = issue.path.map((x) => x.toString()).join(".");
        break;
      case "invalid_literal":
        title = "Invalid Literal";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { expected: issue.expected, received: issue.received };
        break;
      case "invalid_return_type":
        title = "Invalid Return Type";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { returnTypeError: issue.returnTypeError };
        break;
      case "invalid_string":
        title = "Invalid String";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { validation: issue.validation };
        break;
      case "invalid_type":
        title = "Invalid Type";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { expected: issue.expected, received: issue.received };
        break;
      case "invalid_union":
        title = "Invalid Union";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { unionErrors: issue.unionErrors };
        break;
      case "invalid_union_discriminator":
        title = "Invalid Union Discriminator";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { options: issue.options };
        break;
      case "not_finite":
        title = "Not Finite";
        instance = issue.path.map((x) => x.toString()).join(".");
        break;
      case "not_multiple_of":
        title = "Not Multiple Of";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { multipleOf: issue.multipleOf };
        break;
      case "too_big":
        title = "Too Big";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = {
          maximum: issue.maximum,
          inclusive: issue.inclusive,
          exact: issue.exact,
          type: issue.type,
        };
        break;
      case "too_small":
        title = "Too Small";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = {
          minimum: issue.minimum,
          inclusive: issue.inclusive,
          exact: issue.exact,
          type: issue.type,
        };
        break;
      case "unrecognized_keys":
        title = "Unrecognized Keys";
        instance = issue.path.map((x) => x.toString()).join(".");
        extra = { keys: issue.keys };
        break;
      default:
        title = "Unrecognized Zod Issue";
        instance = "unrecognized";
        break;
    }
    let details = `In ${context} while validating the ${instance} field against ${schema} schema, got: ${
      issue.message
    }: ${JSON.stringify(extra)}`;

    return {
      severity: issue.fatal ? "error" : "warning",
      type: `zod:${issue.code}`,
      title,
      // The instance is the context (calling function), schema validated and then generally the path
      instance: `${context}/${schema}::${instance}`,
      details,
      extra: { ...extra, ...span },
    };
  };
}
