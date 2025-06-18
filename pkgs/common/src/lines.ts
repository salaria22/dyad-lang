/**
 * This is a useful class for construction collections of lines (potentially
 * indented) and then spitting them back out
 */
export class Lines {
  /**
   * Private element used to store the lines.
   */
  private lines: string[] = [];
  private done: boolean = false;
  /**
   * Construct an instance of `Lines`.
   *
   * @param prefix Prefix to use on each line
   */
  constructor(protected prefix: string) {}
  /**
   * This adds lines be ensures they are all prefixed.  This is analogous
   * to `Array.push`, but I used `add` deliberate to make it clear that this
   * is doing something slightly different.
   *
   * @param lines The lines to add (potentially more than one)
   */
  add(...lines: string[]) {
    if (this.done) {
      console.warn(`adding line '${lines.join("|")} after calling toString()`);
    }
    for (const line of lines) {
      const parts = line.split("\n");
      for (const part of parts) {
        this.lines.push(this.prefix + part);
      }
    }
  }
  /** Join the lines by carriage returns and return as a string. */
  toString(): string {
    this.done = true;
    return this.lines.join("\n");
  }
}
