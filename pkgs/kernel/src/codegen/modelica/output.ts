export interface Output {
  startModule(moduleName: string[]): void;
  endModule(moduleName: string[]): void;
  startFile(file: string): void;
  endFile(file: string): void;
  writeLine(s: string): void;
  write(s: string): void;
  close(): void;
}

export class StringOutput implements Output {
  public results: Record<string, string> = {};
  public currentModule: string[] | null = null;
  public currentFile: string | null = null;
  public closed: boolean = false;

  public startModule(moduleName: string[]) {
    if (this.currentModule !== null) {
      throw new Error(
        `Attempted to start writing module ${moduleName.join(
          "."
        )} without closing ${this.currentModule.join(".")}`
      );
    }
    this.currentModule = moduleName;
  }

  public endModule(moduleName: string[]) {
    if (this.currentModule === null) {
      throw new Error(
        `Attempted to close module ${moduleName.join(
          "."
        )} when there was no open module to write to`
      );
    }
    this.currentModule = null;
  }

  public startFile(filename: string) {
    if (this.currentFile !== null) {
      throw new Error(
        `Attempted to start writing file ${filename} without closing ${this.currentFile}`
      );
    }
    this.currentFile = filename;
    this.results[this.currentFile] = "";
  }
  public endFile(filename: string) {
    if (this.currentFile === null) {
      throw new Error(
        `Attempted to close file ${filename} when there was no open file to write to`
      );
    }
    this.currentFile = null;
  }
  public write(s: string): void {
    if (this.closed) {
      throw new Error("StringOutput is closed, writing is no longer allowed");
    }
    if (this.currentFile === null) {
      throw Error(`Attempted to write without a currently open file`);
    }
    this.results[this.currentFile] = this.results[this.currentFile] + s;
  }
  public writeLine(s: string): void {
    this.write(s);
    this.write("\n");
  }
  close() {
    this.closed = true;
  }
}
