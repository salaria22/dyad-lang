import { Problem, problemError } from "../problem.js";
import { failedResult, partialResult, successfulResult } from "./index.js";
import { Result } from "./result.js";

const testProblem1 = problemError("tp1", "Test Problem 1");
const testProblem2 = problemError("tp2", "Test Problem 2");
const testProblem3 = problemError("tp3", "Test Problem 3");

describe("Test Result type", () => {
  test("Test Result.map/mapAsync", async () => {
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));
    expect(r.includes("tp1")).toEqual(true);
    expect(r.includes("tp2")).toEqual(true);
    const rx2 = r.map((x) => x * 2);
    expect(rx2.includes("tp1")).toEqual(true);
    expect(rx2.includes("tp2")).toEqual(true);

    const ar = await r.mapAsync((v) => Promise.resolve(v));
    expect(r.sameValue(ar)).toEqual(true);

    const fr = await r.mapAsync(async () => {
      throw testProblem1("z", "Z");
    });
    expect(fr.includes("tp1"));
  });
  test("Test chainResult", async () => {
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));
    expect(r.includes("tp1")).toEqual(true);
    expect(r.includes("tp2")).toEqual(true);
    expect(r.includes("tp3")).toEqual(false);
    expect(r.problems()).toHaveLength(2);

    expect(() => r.unsafeCoerce(true)).toThrow();

    const rx2 = r.chain((x) => partialResult(x * 2, testProblem3("z", "Z")));
    expect(rx2.includes("tp1")).toEqual(true);
    expect(rx2.includes("tp2")).toEqual(true);
    expect(rx2.includes("tp3")).toEqual(true);
    expect(rx2.hasValue()).toEqual(true);
    if (rx2.hasValue()) {
      expect(rx2.value).toEqual(10);
    }

    const arx2 = await r.chainAsync(async (x) =>
      partialResult(x * 2, testProblem3("z", "Z"))
    );
    expect(arx2.includes("tp1")).toEqual(true);
    expect(arx2.includes("tp2")).toEqual(true);
    expect(arx2.includes("tp3")).toEqual(true);
    expect(arx2.hasValue()).toEqual(true);
    if (arx2.hasValue()) {
      expect(arx2.value).toEqual(10);
    }

    const frx2 = await r.chainAsync(async () => {
      throw testProblem3("z", "Z");
    });
    expect(frx2.includes("tp1")).toEqual(true);
    expect(frx2.includes("tp2")).toEqual(true);
    expect(frx2.includes("tp3")).toEqual(true);
    expect(frx2.hasValue()).toEqual(false);
  });

  test("Test filter", () => {
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));
    const rn = r.filter(Number.isInteger, testProblem3("z", "Z"));
    expect(rn.hasValue()).toEqual(true);
    expect(rn.includes("tp3")).toEqual(false);
    expect(rn.includes("tp2")).toEqual(true);
    const rn2 = r.filter(Number.isNaN, testProblem3("z", "Z"));
    expect(rn2.hasValue()).toEqual(false);
    expect(rn2.includes("tp3")).toEqual(true);
    expect(rn2.includes("tp2")).toEqual(false);

    const rn3 = r.filter(Array.isArray, (v) =>
      testProblem3("z", `Expected an array but got ${v}`)
    );
    expect(rn3.problems()).toEqual([
      {
        details: "Expected an array but got 5",
        extra: undefined,
        instance: "z",
        severity: "error",
        title: "Test Problem 3",
        type: "tp3",
      },
    ]);
  });

  test("Test chainResult with throw", () => {
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));
    const rx2 = r.chain(() => {
      throw testProblem3("z", "Z");
    });
    expect(rx2.includes("tp1")).toEqual(true);
    expect(rx2.includes("tp2")).toEqual(true);
    expect(rx2.includes("tp3")).toEqual(true);

    expect(rx2.problems()).toHaveLength(3);
  });

  test("Test SuccessfulResult", async () => {
    const sr = successfulResult(5);
    const mr2 = sr.map((x) => x * 2);
    expect(mr2.orDefault(0)).toEqual(10);

    const amr2 = await sr.mapAsync((x) => Promise.resolve(x * 2));
    expect(amr2.orDefault(0)).toEqual(10);
    const cr2 = sr.chain((x) => successfulResult(x * 2));
    expect(cr2.orDefault(0)).toEqual(10);
    const fr2 = sr.chain(() => failedResult(testProblem1("x", "X")));
    expect(fr2.hasValue()).toEqual(false);
    expect(fr2.includes("tp1"));
    const tr2 = sr.chain(() => {
      throw testProblem1("x", "X");
    });
    expect(tr2.hasValue()).toEqual(false);
    expect(tr2.includes("tp1"));

    const acr2 = await sr.chainAsync((x) =>
      Promise.resolve(successfulResult(x * 2))
    );
    expect(acr2.orDefault(0)).toEqual(10);
    const afr2 = await sr.chainAsync(() =>
      Promise.reject(testProblem1("x", "X"))
    );
    expect(afr2.hasValue()).toEqual(false);
    expect(afr2.includes("tp1"));

    const np = sr.add();
    expect(np.hasProblems()).toEqual(false);
    expect(np.sameValue(sr)).toEqual(true);
  });
  test("Test ifResult", () => {
    const problems: Problem[] = [];
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));

    r.ifResult((v) => {
      expect(v).toEqual(5);
    }, problems);
    expect(problems).toHaveLength(2);
  });

  test("Test unwrapping failed result", async () => {
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));
    const rx2 = r.chain((x) => {
      const i = failedResult<number>(testProblem3("z", "Z"));
      return i.map((v) => x + v);
    });
    expect(rx2.hasProblems()).toEqual(true);
    expect(rx2.hasValue()).toEqual(false);
    expect(rx2.orDefault(10)).toEqual(10);
    expect(rx2.includes("tp1")).toEqual(true);
    expect(rx2.includes("tp2")).toEqual(true);
    expect(rx2.includes("tp3")).toEqual(true);

    const ar = await rx2.mapAsync((v) => Promise.resolve(v));
    expect(rx2.sameValue(ar)).toEqual(false);

    const fr = await rx2.mapAsync(async () => {
      throw testProblem1("z", "Z");
    });
    expect(fr.includes("tp1"));
    expect(fr.includes("tp3"));

    const cr = rx2.chain((v) => successfulResult(v + 1));
    expect(cr.includes("tp1"));
    expect(cr.includes("tp3"));

    const acr = await rx2.chainAsync(async (v) => successfulResult(v + 1));
    expect(acr.includes("tp1"));
    expect(acr.includes("tp3"));

    expect(() => acr.unsafeCoerce()).toThrow();
    const problems: Problem[] = [];
    cr.ifProblems((p) => problems.push(...p));
    expect(problems).toEqual(cr.problems());
  });
  test("Test unwrapping a partial result", () => {
    const r = partialResult(5, testProblem1("x", "X"), testProblem2("y", "Y"));
    const rx2 = r.chain((x) => {
      const i = partialResult(10, testProblem3("z", "Z"));
      const ret = i.map((v) => x + v);
      return ret;
    });
    expect(rx2.hasProblems()).toEqual(true);
    expect(rx2.hasValue()).toEqual(true);
    expect(rx2.includes("tp1")).toEqual(true);
    expect(rx2.includes("tp2")).toEqual(true);
    expect(rx2.includes("tp3")).toEqual(true);
  });

  test("Test resultAll", () => {
    const empty = Result.all([]);
    expect(empty.hasValue()).toEqual(true);
    if (empty.hasValue()) {
      expect(empty.value).toEqual([]);
    }
    let r: Array<Result<number>> = [partialResult(5), successfulResult(10)];
    let r2 = Result.all(r);
    expect(r2.hasProblems()).toEqual(false);
    expect(r2.hasValue()).toEqual(true);
    if (r2.hasValue()) {
      expect(r2.unsafeCoerce()).toEqual([5, 10]);
    }
    expect(r2.mapOrDefault((x) => x, [2])).toEqual([5, 10]);
    expect(r2.mapOrDefault((x) => [1, ...x], [2])).toEqual([1, 5, 10]);
    expect(r2.orDefault([2])).toEqual([5, 10]);

    r = [partialResult(5, testProblem1("x", "X")), successfulResult(10)];
    r2 = Result.all(r);
    expect(r2.hasProblems()).toEqual(true);
    expect(r2.hasValue()).toEqual(true);
    if (r2.hasValue()) {
      expect(r2.unsafeCoerce()).toEqual([5, 10]);
    }
    expect(r2.includes("tp1")).toEqual(true);

    r = [
      partialResult(5, testProblem1("x", "X")),
      failedResult(testProblem2("y", "Y")),
    ];
    r2 = Result.all(r);
    expect(r2.hasProblems()).toEqual(true);
    expect(r2.hasValue()).toEqual(false);
    expect(r2.includes("tp1")).toEqual(true);
    expect(r2.includes("tp2")).toEqual(true);
  });

  test("Test resultCombine", () => {
    const empty = Result.combine({});
    expect(empty.hasValue()).toEqual(true);
    if (empty.hasValue()) {
      expect(empty.value).toEqual({});
    }
    let r: Record<string, Result<number>> = {
      a: partialResult(5, testProblem1("x", "X")),
      b: successfulResult(10),
    };
    let r2 = Result.combine(r);
    expect(r2.hasProblems()).toEqual(true);
    expect(r2.hasValue()).toEqual(true);
    if (r2.hasValue()) {
      const v = r2.unsafeCoerce();
      expect(v.a).toEqual(5);
      expect(v.b).toEqual(10);
    }
    expect(r2.includes("tp1")).toEqual(true);

    const rr2 = r2.replaceProblems(testProblem3("z", "Z"));
    expect(rr2.includes("tp1")).toEqual(false);
    expect(rr2.includes("tp3")).toEqual(true);

    r = {
      a: partialResult(5, testProblem1("x", "X")),
      b: failedResult(testProblem2("y", "Y")),
    };
    r2 = Result.combine(r);
    expect(r2.hasProblems()).toEqual(true);
    expect(r2.hasValue()).toEqual(false);
    expect(r2.includes("tp1")).toEqual(true);
    expect(r2.includes("tp2")).toEqual(true);

    const fr2 = r2.replaceProblems(testProblem3("z", "Z"));
    expect(fr2.includes("tp1")).toEqual(false);
    expect(fr2.includes("tp2")).toEqual(false);
    expect(fr2.includes("tp3")).toEqual(true);
  });
});
