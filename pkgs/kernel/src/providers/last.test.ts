import { ReplaySubject } from "rxjs";
import { lastValue, update } from "./last.js";

describe("Observable tests", () => {
  test("Test resolution with no value", () => {
    const subj = new ReplaySubject<string>();
    expect(() => lastValue(subj)).toThrow();
    expect(() => lastValue(subj, "don't do that")).toThrow("don't do that");
  });
  test("Test resolution with value", () => {
    const subj = new ReplaySubject<string>();
    subj.next("hello");
    expect(lastValue(subj)).toEqual("hello");
  });
  test("Test updating", () => {
    const subj = new ReplaySubject<number>();
    expect(() => lastValue(subj)).toThrow();
    expect(() => update(subj, (v) => v + 1)).toThrow();
    subj.next(5);
    expect(lastValue(subj)).toEqual(5);
    subj.next(7);
    expect(lastValue(subj)).toEqual(7);
    update(subj, (v) => v + 10);
    expect(lastValue(subj)).toEqual(17);
  });
});
