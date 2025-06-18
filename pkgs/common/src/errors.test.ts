import { ProblemError, createError, createExtraError } from "./errors.js";
import { isProblem } from "./problem.js";

const EmptyWorkspaceError = createError("E1000", "Empty workspace");
const IncorrectLength = createExtraError<{ expected: number; actual: number }>(
  "E1000",
  "Empty workspace"
);

describe("Test custom error types", () => {
  test("Test simple case", () => {
    let caught: any = undefined;
    try {
      throw new EmptyWorkspaceError("root", "Root was empty", undefined);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    expect(caught).toBeInstanceOf(ProblemError);
    expect(caught).toBeInstanceOf(EmptyWorkspaceError);
    expect(caught.type).toEqual("E1000");
    expect(caught.instance).toEqual("root");
    expect(caught.title).toEqual("Empty workspace");
    expect(caught.details).toEqual("Root was empty");
    expect(caught.message).toEqual("Root was empty");
    expect(isProblem(caught)).toEqual(true);
    expect(isProblem("text")).toEqual(false);
  });

  test("Test case with additional data", () => {
    let caught: any = undefined;
    try {
      throw new IncorrectLength("root", "Root was empty", {
        expected: 1,
        actual: 0,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ProblemError);
      expect(e).toBeInstanceOf(IncorrectLength);
      if (e instanceof IncorrectLength) {
        expect(e.type).toEqual("E1000");
        expect(e.instance).toEqual("root");
        expect(e.title).toEqual("Empty workspace");
        expect(e.details).toEqual("Root was empty");
        expect(e.message).toEqual("Root was empty");
        expect(e.extra.expected).toEqual(1);
        expect(e.extra.actual).toEqual(0);
        expect(isProblem(e)).toEqual(true);
      }
      caught = e;
    }
    expect(caught).toBeDefined();
  });
});
