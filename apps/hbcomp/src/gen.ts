import Handlerbars from "handlebars";
import path from "node:path";
import fs from "fs";
import prettier from "prettier";

export async function generateTemplates(dir: string) {
  const files = await fs.promises.readdir(dir);

  const lines: string[] = [];

  lines.push(`/* eslint-disable no-unused-vars */`);
  lines.push(`// @ts-nocheck`);
  lines.push(`import Handlebars from "handlebars";`);
  lines.push(`export const templates = {`);
  const ext = ".handlebars";
  for (const file of files.filter((x) => x.endsWith(ext))) {
    const source = await fs.promises.readFile(path.join(dir, file));
    const obj = Handlerbars.precompile(source.toString(), {});
    const name = file.slice(0, -ext.length);
    lines.push(`  "${name}": Handlebars.template(${(obj as any).toString()}),`);
  }
  lines.push(`}`);

  const source = lines.join("\n");
  const formattedCode = await prettier.format(source, {
    parser: "typescript", // Specify the parser, e.g., "babel", "typescript", "markdown"
    plugins: [], // Add any plugins if needed
  });
  console.log(formattedCode);
}
