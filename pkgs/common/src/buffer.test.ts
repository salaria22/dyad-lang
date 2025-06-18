import { buf2str, str2buf } from "./buffer.js";

describe("Test buffer related functionality", () => {
  test("Test round trip", () => {
    const cases: string[] = [
      "hello",
      "bye",
      "a very long string with some spaces in it",
    ];
    for (const c of cases) {
      const buf = str2buf(c);
      const str = buf2str(buf);
      expect(str).toEqual(c);
    }
  });
});
