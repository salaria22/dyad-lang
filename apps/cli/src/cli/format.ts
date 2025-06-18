import fs from "fs";
import path from "path";
import {
  parseDyad,
  unparseDyad,
  AstBuilder,
} from "@juliacomputing/dyad-parser";
import { sourceKey } from "@juliacomputing/dyad-ast";
import { fileExtension } from "@juliacomputing/dyad-common";

export interface FormatOption {
  dryrun: boolean;
}
export async function format(file: string, options: FormatOption) {
  const files: string[] = [];

  const args = [file];
  for (const arg of args) {
    try {
      const stats = await fs.promises.stat(arg);
      if (stats.isDirectory()) {
        const contents = await fs.promises.readdir(arg);
        for (const entry of contents) {
          if (entry.endsWith(`.${fileExtension}`)) {
            files.push(path.join(arg, entry));
          }
        }
      } else if (stats.isFile() && arg.endsWith(`.${fileExtension}`)) {
        files.push(arg);
      }
    } catch (e: any) {
      console.error(`Error accessing ${arg}: `, e);
    }
  }
  for (const file of files) {
    try {
      const contents = await fs.promises.readFile(file);
      const res = parseDyad(contents.toString(), file, null);
      const problems = [...res.lexErrors, ...res.parseErrors];
      if (problems.length > 0) {
        console.error(`Error parsing ${file}:`);
        for (const prob of problems) {
          console.error(
            `Parsing/lexing error: ${prob.title} in ${file}: ${prob.details}`
          );
        }
      }
      if (res.cst && problems.length === 0) {
        const builder = new AstBuilder();
        const ast = builder.file(res.cst.children, {
          provider: "---",
          file: sourceKey(file, []),
        });
        const formatted = unparseDyad(ast);
        if (options.dryrun) {
          console.log(formatted);
        } else {
          await fs.promises.writeFile(file, formatted);
        }
      } else {
        console.error(`Unable to parse ${file}`);
      }
    } catch (e: any) {
      console.error(`Error while parsing ${file}:`, e);
    }
  }
}
