import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import {
  CodeGenAspect,
  codeGenAspects,
  CodeGenKey,
  ModuleName,
  MTKHandler,
} from "./events.js";
import path from "path";
import { FileSystemInterface } from "../../providers/fs.js";
import { warning } from "../warning.js";

import debug from "debug";

const fslog = debug("codegen:fshandler");

export class FSHandler implements MTKHandler {
  currentModule: Maybe<ModuleName> = Nothing;
  precompilationBuffer: string[] = [];
  preambleBuffer: Record<CodeGenAspect, string> = {
    type: "",
    definition: "",
    experiment: "",
    precompilation: "",
    test: "",
  };
  keyBuffer: CodeGenKey[] = [];
  constructor(protected fs: FileSystemInterface) {}
  async modules(all: Array<ModuleName>): Promise<void> {
    fslog("modules = %j", all);
  }
  private resetBuffers() {
    fslog("Resetting buffers");
    this.precompilationBuffer = [];
    this.keyBuffer = [];
    this.preambleBuffer = {
      type: "",
      definition: "",
      experiment: "",
      precompilation: "",
      test: "",
    };
  }
  async startModule(module: ModuleName): Promise<void> {
    fslog("Starting module '%s'", module.join("."));
    this.resetBuffers();
    this.currentModule = Just(module);
  }
  async preamble(
    module: ModuleName,
    aspect: CodeGenAspect,
    code: string
  ): Promise<void> {
    const cur = this.preambleBuffer[aspect] ?? "";
    this.preambleBuffer[aspect] = `${cur}\n${code}`;
    fslog(
      "Preamble for %s in module '%s' is:\n%s",
      aspect,
      module.join("."),
      code
    );
  }
  async precompilation(module: ModuleName, code: string): Promise<void> {
    this.checkModule(module);
    this.precompilationBuffer.push(code);
    fslog(
      "Stored precompilation code for module '%s':\n%s",
      module.join("."),
      code
    );
  }
  private async createDirectory(dir: string): Promise<void> {
    fslog("  Making directory %s", dir);
    try {
      fslog("    Checking if %s exists (as a directory)", dir);
      const dirExists = await this.fs
        .exists(dir, { type: "directory" })
        .then((v) => {
          fslog("    Result: %j", v);
          return v;
        })
        .catch((e) => {
          console.error(`Error checking if directory ${dir} exists: `, e);
          fslog("    Error!!!");
        });
      fslog("    Exists: %j", dirExists);
      if (dirExists) {
        fslog("    Directory %s already exists", dir);
        return;
      }
      await this.fs.mkdir(dir, { recursive: true });
      fslog("  ...success");
      return;
    } catch (e) {
      console.error(`Error creating directory ${dir}: `, e);
      fslog("  ...exception thrown");
      return;
    }
  }
  private checkModule(module: ModuleName): void {
    // Check that the current module matches this key
    this.currentModule.caseOf({
      Nothing: () => {
        throw new Error(
          `Call to FSHandler.source for module ${module.join(
            "."
          )} without calling FSHandler.startModule`
        );
      },
      Just: (mn) => {
        if (!mn.every((frag, i) => frag === module[i])) {
          throw new Error(
            `Call to FSHander.source for module ${module.join(
              "."
            )} after call to FSHandler.startModule for module ${mn.join(".")}`
          );
        }
      },
    });
  }
  async source(key: CodeGenKey, code: string): Promise<void> {
    fslog("Setting source for %j", key);
    try {
      this.checkModule(key.module);
      const dir = path.join("generated", ...key.module);
      fslog("  Directory: %s", dir);
      if (
        this.keyBuffer.some(
          (k) =>
            k.kind === key.kind &&
            k.module.join(".") === key.module.join(".") &&
            k.name === key.name
        )
      ) {
        fslog("  Error: called twice");
        throw new Error(
          `source handler called twice for ${
            key.kind
          } aspect of ${key.module.join(".")}/${key.name}`
        );
      }
      // fslog("  Attempting to create directory %s", dir);
      // await this.createDirectory(dir);
      // fslog("  Directory created");
      const keyfile = path.join(dir, `${key.name}_${key.kind}.jl`);
      fslog("  File: %s", keyfile);
      const contents = `${warning}

${code}
`;
      await this.fs.writeFile(keyfile, contents);
      fslog("  Wrote %s", keyfile);
      this.keyBuffer.push(key);
      fslog("...success");
    } catch (e) {
      console.error(`Error setting source for ${key.name}: `, e);
      fslog("...exception thrown");
      throw e;
    }
  }
  async endModule(module: ModuleName): Promise<void> {
    fslog("End of module '%s'", module.join("."));
    try {
      this.checkModule(module);
      const precomp = this.precompilationBuffer.join("\n");
      const precompfile = path.join("generated", "precompilation.jl");
      const precompilationPreamble = this.preambleBuffer["precompilation"];
      await this.fs.writeFile(
        precompfile,
        `${precompilationPreamble}

@setup_workload begin
    @compile_workload begin
${prefix(precomp, "        ")}
    end
end
`
      );
      fslog("Wrote %s", precompfile);

      const remainingKinds = codeGenAspects.filter(
        (x) => x !== "precompilation"
      );

      for (const kind of remainingKinds) {
        fslog("Writing out %ss in module '%s'", kind, module.join("."));
        const dir = path.join("generated", ...module);
        // await this.createDirectory(dir);
        const names = this.keyBuffer
          .filter((key) => key.kind === kind)
          .map((key) => key.name);
        const preamble = this.preambleBuffer[kind];
        const files = new Set<string>([...names.map((n) => `${n}_${kind}.jl`)]);
        const lines = [
          preamble,
          "",
          ...[...files].map((name) => `include("${name}")`),
        ];
        const kindfile = path.join(dir, `${kind}s.jl`);
        await this.fs.writeFile(kindfile, lines.join("\n"));
        fslog("Wrote %s", kindfile);
      }

      this.resetBuffers();
      this.currentModule = Nothing;
      fslog("...success");
    } catch (e) {
      console.error(`Error writing module ${module.join(".")}: `, e);
      fslog("...exception thrown");
      throw e;
    }
  }
  async close(): Promise<void> {
    fslog("Closing FSHandler");
  }
}

function prefix(block: string, pre: string): string {
  return block
    .split("\n")
    .map((x) => `${pre}${x}`)
    .join("\n");
}
