import { generateTemplates } from "./gen.js";

//console.log("argv = ", process.argv);

if (process.argv.length !== 3) {
  console.error(`usage: ${process.argv[0]} ${process.argv[1]} <dir>`);
  process.exit(1);
}

const dir = process.argv[2];

//console.log("cwd = ", process.cwd());
// console.log("Generate code for templates in ", dir);
generateTemplates(dir).catch(console.error);
