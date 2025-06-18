#!/usr/bin/env node
import { program } from "commander";
import { performCompile } from "../cli/compile.js";

import debug from "debug";
import ms from "ms";
import { performLibraryCreation } from "../cli/create.js";
import { format } from "../cli/format.js";
import { render } from "../cli/render.js";
import { parse } from "../cli/parse.js";
import { unparse } from "../cli/unparse.js";
import { flatten } from "../cli/flatten.js";
import { document } from "../cli/docs.js";
import { languageName, sourceFolder } from "@juliacomputing/dyad-common";

debug.formatArgs = function formatArgs(this: any, args: string[]) {
  const { namespace: name, useColors } = this;

  if (useColors) {
    const c = this.color;
    const colorCode = "\u001B[3" + (c < 8 ? c : "8;5;" + c);
    const prefix = `  ${colorCode};1m${name} \u001B[0m`;

    args[0] = prefix + args[0].split("\n").join("\n" + prefix);
    args.push(colorCode + "m+" + ms(this.diff) + "\u001B[0m");
  } else {
    args[0] = new Date().toISOString() + name + " " + args[0];
  }
};

// TODO: Find a way to (at build time) grab the version number from package.json
// and add it here using the `.version(...)` method.
program.name("dyad").description(`${languageName} CLI compiler`);

program
  .command("compile")
  .description(
    `Compile Dyad files in ./${sourceFolder} of the specified Julia package`
  )
  .argument("<directory>", "Julia package directory")
  .option("--debug <string>", "debug pattern", "")
  .option("-w, --watch", "Watch for file changes", false)
  .option("--project <string>", "Path to the Project.toml to use, relative to the current working directory (not the package directory)")
  .addHelpText(
    "after",
    `
    Compile Dyad files in ./${sourceFolder} of the specified Julia package.

    The path to the package is specified as the argument to dyad compile, 
    and the ${languageName} files are expected to be in the ./${sourceFolder} 
    directory of that package.

    For example, to compile the files in the DyadTutorial package, living in \`./DyadTutorial\`, 
    you would run:

    % dyad compile DyadTutorial

    This will compile all the ${languageName} files in the DyadTutorial package.
    You can then load the package in Julia by \`using DyadTutorial\`.
    `
  )
  .action(performCompile);

program
  .command("create")
  .description("Create a template Dyad component library, ready to go")
  .argument("<package>", "Name of package")
  .option("-d, --dir <string>", "Directory to create the library in", ".")
  .option("--debug <string>", "debug pattern (e.g., \"workspace:init\" or \"codegen:mtk\" or \"*\")", "")
  .addHelpText(
    "after",
    `
    Create a template Dyad component library, with a pre-defined "Hello" component
    and "World" analysis.

    The library is written to \`<dir>/<package>\`, so an invocation like
    \`dyad create Hello\` will create a directory called \`Hello\` inside the
    current directory.

    This is a full Julia package with a \`Project.toml\` file, a \`src/\` directory,
    and a \`dyad/\` directory that holds the Hello component and World analysis.

    You can then immediately use \`Pkg.dev("<dir>/<package>")\` in Julia to make
    the package available, and load it via \`using <package>\` in Julia, either in
    the REPL or in a script.
    `
  )
  .action(performLibraryCreation);

program
  .command("format")
  .description(`format all .${languageName} files in one or more files or whole directories`)
  .argument("<file_or_directory>", "Name of file or directory to format")
  .option("-n, --dryrun", "output to stdout", false)
  .action(format);

program
  .command("render")
  .description("render a specific model")
  .argument(
    "<component>",
    `Name of component to render (format: <Library>.<Module>.<Component>, like DyadTutorial.Hello)`
  )
  .option("-d, --dir <string>", "Directory of Dyad library", ".")
  .action(render);

program
  .command("parse")
  .description("export ${languageName} AST as JSON from a component in a library")
  .argument(
    "<component>",
    "Name of component to parse (format: <Library>.<Module>.<Component>, like DyadTutorial.Hello)"
  )
  .option("-d, --dir <string>", "directory of the Dyad library", ".")
  .addHelpText(
    "after",
    `
    Export the ${languageName} AST as JSON from a component in a library.

    The component is specified as a string in the format \`<Library>.<Module>.<Component>\`.

    The output is written to stdout.
    `
  )
  .action(parse);

program
  .command("unparse")
  .description(`read AST as JSON and unparse into ${languageName} source`)
  .addHelpText(
    "after",
    `
    Read the ${languageName} AST as JSON from stdin and unparse it into ${languageName} source code.

    The output is written to stdout.

    For an example script, run the following:

    % dyad create DyadTutorial; dyad parse DyadTutorial.Hello --dir DyadTutorial | dyad unparse

    and you should see:

    component Hello
      variable x::Real(units="m")
      parameter k::Real(units="1/s") = 1
      parameter x0::Real(units="m") = 10
    relations
      initial x = x0
      der(x) = -k*x
    metadata {"Dyad": {"tests": {"case1": {"stop": 10, "expect": {"initial": {"x": 10}}}}}}
    end
    `
  )
  .action(unparse);

program
  .command("flatten")
  .description("output a flattened definition")
  .argument(
    "<component>",
    "Name of component to render (format: <Library>.<Module>.<Component>, like DyadTutorial.Hello)"
  )
  .option("-d, --dir <string>", `Directory of ${languageName} library`, ".")
  .option("-s, --strip", "strip metadata", false)
  .addHelpText(
    "after",
    `
    Output a flattened definition of a component, with all sub-components
    "flattened" or expanded into the final definition.

    The output is written to stdout.
    `
  )
  .action(flatten);

program
  .command("document")
  .description("output generated documentation")
  .argument("<library>", "Name of library to generate documentation for")
  .option("-d, --dir <string>", "Directory of Dyad library", ".")
  .option("--project <string>", "Path to the Project.toml to use, relative to the current working directory (not the package directory)")
  .addHelpText(
    "after",
    `
    Output generated Markdown documentation for a library.

    The output is written to <library>/docs/src.  You can render HTML docs from this
    by running julia --project=<library>/docs <library>/docs/make.jl, which will render
    the docs into <library>/docs/build/.
    `
  )
  .action(document);

program.parse();
