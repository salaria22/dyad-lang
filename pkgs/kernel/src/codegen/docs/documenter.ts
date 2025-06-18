import {
  assertUnreachable,
  buf2str,
  Lines,
  Problem,
  Result,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { FileSystemInterface } from "../../providers/fs.js";
import {
  definitionEntity,
  describeEntity,
  Entity,
  LibraryEntity,
  missingEntity,
  QueryHandler,
} from "../../workspace/index.js";
import { CompilerAssertionError } from "../../workspace/errors.js";
import {
  ASTNode,
  Definition,
  isAnalysisDefinition,
  isComponentDefinition,
  isConnectorDefinition,
  isFunctionTypeDefinition,
  isParsedFile,
  isScalarTypeDefinition,
  isStructTypeDefinition,
  DyadLibrary,
} from "@juliacomputing/dyad-ast";
import { instantiateModel } from "../../instantiate/model.js";
import { generateIcon } from "../icons/icon.js";
import { renderComponentMarkdown } from "./component.js";
import { documenterOptions, NormalizedRenderOptions } from "./options.js";
import { renderAnalysis } from "./analysis.js";
import { instantiateAnalysis } from "../../instantiate/analysis.js";
import {
  instantiateRecordConnector,
  instantiateScalarConnector,
} from "../../instantiate/connector.js";
import {
  renderScalarConnector,
  renderStructureConnector,
} from "./connector.js";
import { renderScalarType } from "./scalar.js";
import { TestCasesSection } from "./tests.js";
import { codeFence, inlineCode } from "./primitives.js";
import { renderFunctionType } from "./fun.js";
import { renderStructType } from "./struct.js";
import { flattenDefinitionEntity } from "../../workspace/selectors/flatten.js";
import {
  getDefinitionNode,
  getLibraryNode,
} from "../../workspace/selectors/nodes.js";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import path from "path-browserify";

export interface DocumenterPage {
  description: string;
  id: string;
}

function comparePages(a: DocumenterPage, b: DocumenterPage) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export interface DocumenterPages {
  libraryName: string;
  scalarTypes: DocumenterPage[];
  functionTypes: DocumenterPage[];
  partialTypes: DocumenterPage[];
  structTypes: DocumenterPage[];
  enumTypes: DocumenterPage[];
  connectors: DocumenterPage[];
  components: DocumenterPage[];
  analyses: DocumenterPage[];
  examples: DocumenterPage[];
  experiments: DocumenterPage[];
  tests: DocumenterPage[];
  test_cross_references: Record<string, Set<string>>;
}

export async function renderDocumenterDocumentation(
  query: QueryHandler,
  entity: LibraryEntity,
  fs: FileSystemInterface,
  options: NormalizedRenderOptions
): Promise<Problem[]> {
  const problems: Problem[] = [];
  const files = new Map<string, string>();
  const libnode = query(getLibraryNode(entity));
  if (!libnode.hasValue()) {
    return [
      missingEntity(
        entity,
        `Unable to find node for ${describeEntity(entity)}`
      ),
    ];
  }
  const readme = await readReadme(fs);
  await libnode.ifAsyncResult(async (lib) => {
    const pages = collectPages(lib, query);
    // Generate pages
    files.set("src/index.md", generateIndex(lib, pages, readme));
    files.set("pages.jl", generatePages(pages));
    files.set("make.jl", generateMake(lib));
    files.set("Project.toml", generateProject(lib));
    files.set(".gitignore", generateIgnore());
    // Render scalar types
    for (const st of pages.scalarTypes) {
      await renderDocumenterScalarType(lib, st, query, fs, problems);
    }
    for (const st of pages.functionTypes) {
      await renderDocumenterFunctionType(lib, st, query, fs, problems);
    }
    // Render struct types
    for (const st of pages.structTypes) {
      await renderDocumenterStructType(lib, st, query, fs, problems);
    }
    // Render partial types
    for (const comp of pages.partialTypes) {
      await renderDocumenterComponent(
        lib,
        comp,
        pages,
        query,
        fs,
        "types",
        options,
        problems
      );
    }
    // Render connectors
    for (const con of pages.connectors) {
      await renderDocumenterConnector(lib, con, query, fs, problems);
    }
    // Render components
    for (const comp of pages.components) {
      await renderDocumenterComponent(
        lib,
        comp,
        pages,
        query,
        fs,
        "components",
        options,
        problems
      );
    }
    // Render analyses
    for (const analysis of pages.analyses) {
      await renderDocumenterAnalysis(lib, analysis, query, fs, problems);
    }
    // Render examples
    for (const comp of pages.examples) {
      await renderDocumenterComponent(
        lib,
        comp,
        pages,
        query,
        fs,
        "examples",
        options,
        problems
      );
    }
    // Render Experiments
    for (const comp of pages.experiments) {
      await renderDocumenterComponent(
        lib,
        comp,
        pages,
        query,
        fs,
        "experiments",
        options,
        problems
      );
    }
    // Render Tests
    for (const comp of pages.tests) {
      await renderDocumenterComponent(
        lib,
        comp,
        pages,
        query,
        fs,
        "tests",
        options,
        problems
      );
    }

    const doNotOverwrite = ["make.jl", "Project.toml", ".gitignore"];
    // Write files
    for (const [filename, contents] of files) {
      if ((await fs.exists(filename)) && doNotOverwrite.includes(filename)) {
        continue;
      }
      await fs.writeFile(filename, contents);
    }
  }, problems);
  return problems;
}

async function readReadme(fs: FileSystemInterface): Promise<Maybe<string>> {
  try {
    const docsReadmeFilename = path.join("docs", "README.md");
    if (await fs.exists(docsReadmeFilename)) {
      const contents = await fs.readFile(docsReadmeFilename);
      if (typeof contents === "string") {
        return Just(contents);
      }
      return Just(buf2str(contents));
    }
    const rootReadmeFilename = "README.md";
    if (await fs.exists(rootReadmeFilename)) {
      const contents = await fs.readFile(rootReadmeFilename);
      if (typeof contents === "string") {
        return Just(contents);
      }
      return Just(buf2str(contents));
    }
  } finally {
    return Nothing;
  }
}

function allTypes(pages: DocumenterPages) {
  return [
    ...pages.scalarTypes,
    ...pages.functionTypes,
    ...pages.partialTypes,
    ...pages.enumTypes,
    ...pages.structTypes,
  ].sort(comparePages);
}

function generateFrontMatter(lib: DyadLibrary, readme: Maybe<string>): string {
  const lines = new Lines("");
  readme.caseOf({
    Nothing: () => {
      lines.add(`# ${lib.name}`);
      lines.add("");
      lines.add(
        "This is the documentation for the `" +
          lib.name +
          "` library.  Here you will"
      );
      lines.add(
        "find the documentation for the various definitions contained in `" +
          lib.name +
          "`."
      );
    },
    Just: (text) => {
      lines.add(text);
    },
  });
  lines.add("");
  lines.add(
    "Note that this documentation is automatically generated primarily from the doc strings and metadata associated"
  );
  lines.add("with those definitions.");
  return lines.toString();
}

function generateIndex(
  lib: DyadLibrary,
  pages: DocumenterPages,
  readme: Maybe<string>
) {
  const lines = new Lines("");
  lines.add(generateFrontMatter(lib, readme));
  lines.add("");
  const types = allTypes(pages);

  const section = (sec: string, elements: DocumenterPage[]) => {
    if (elements.length > 0) {
      const dir = sec.toLocaleLowerCase();
      lines.add(`## ${sec}`);
      lines.add("");
      for (const elem of elements) {
        if (elem.description !== "") {
          lines.add(
            "- [`" +
              elem.id +
              "`](" +
              dir +
              "/" +
              elem.id +
              ".md) - " +
              elem.description
          );
        } else {
          lines.add("- [`" + elem.id + "`](" + dir + "/" + elem.id + ".md)");
        }
      }
    }
  };

  section("Types", types);
  section("Connectors", pages.connectors);
  section("Components", pages.components);
  section("Analyses", pages.analyses);
  section("Examples", pages.examples);
  section("Experiments", pages.experiments);
  section("Tests", pages.tests);

  return lines.toString();
}

function generateIgnore() {
  const lines = new Lines("");
  lines.add("/Manifest.toml");
  lines.add("/build");
  return lines.toString();
}
function generateProject(lib: DyadLibrary) {
  const lines = new Lines("");
  lines.add("[deps]");
  lines.add(`Documenter = "e30172f5-a6a5-5a46-863b-614d45cd2de4"`);
  lines.add(`CSV = "336ed68f-0bac-5ca0-87d4-7b16caf5d00b"`);
  lines.add(`DataFrames = "a93c6f00-e57d-5684-b7b6-d8193f3e46c0"`);
  lines.add(
    `DyadEcosystemDependencies = "7bc808db-8006-421e-b546-062440d520b7"`
  );
  lines.add(`Latexify = "23fbe1c1-3f47-55db-b15f-69d7ec21a316"`);
  lines.add(`ModelingToolkit = "961ee093-0014-501f-94e3-6117800e7a78"`);
  lines.add(`OrdinaryDiffEqDefault = "50262376-6c5a-4cf5-baba-aaf4f84d72d7"`);
  lines.add(`Plots = "91a5bcdd-55d7-5caf-9e0b-520d859cae80"`);
  lines.add(``);
  lines.add(`[sources]`);
  lines.add(`${lib.name} = { path = ".." }`);

  return lines.toString();
}
function generateMake(lib: DyadLibrary) {
  const lines = new Lines("");
  lines.add("using Documenter");
  lines.add(`using ${lib.name}`);
  lines.add("");
  lines.add(`include("pages.jl")`);
  lines.add("");
  lines.add(`makedocs(`);
  lines.add(`    modules=[${lib.name}],`);
  lines.add(`    sitename="${lib.name}",`);
  lines.add(`    remotes=nothing,`);
  lines.add(`    warnonly=[:cross_references, :example_block, :missing_docs],`);
  lines.add(`    pages=pages`);
  lines.add(`)`);

  return lines.toString();
}

function unexpected(entity: Entity, exp: string) {
  return (x: ASTNode) =>
    new CompilerAssertionError(
      entity,
      `Expected ${describeEntity(entity)} to be ${exp} but got ${x.kind}`
    );
}
async function renderDocumenterStructType(
  lib: DyadLibrary,
  st: DocumenterPage,
  query: QueryHandler,
  fs: FileSystemInterface,
  problems: Problem[]
) {
  const entity = definitionEntity(lib.name, [], st.id);
  const node = query(getDefinitionNode(entity)).filter(
    isStructTypeDefinition,
    unexpected(entity, "a scalar type definition")
  );
  const flat = query(flattenDefinitionEntity(entity, new Set())).filter(
    isStructTypeDefinition,
    unexpected(entity, "a scalar type definition")
  );
  const parts = Result.combine({ flat, node });
  await ensureDirectoryExists(`src/types/`, fs);
  await parts.ifAsyncResult(({ flat, node }) => {
    const text = renderStructType(documenterOptions, node, flat);
    return fs.writeFile(`src/types/${node.name.value}.md`, text);
  }, problems);
}

async function renderDocumenterScalarType(
  lib: DyadLibrary,
  st: DocumenterPage,
  query: QueryHandler,
  fs: FileSystemInterface,
  problems: Problem[]
) {
  const entity = definitionEntity(lib.name, [], st.id);
  const node = query(getDefinitionNode(entity));
  const def = node.filter(
    isScalarTypeDefinition,
    unexpected(entity, "a scalar type definition")
  );
  const cdef = def.unsafeCoerce();
  const flat = query(flattenDefinitionEntity(entity, new Set())).filter(
    isScalarTypeDefinition,
    unexpected(entity, "a scalar type definition")
  );
  const parts = Result.combine({ flat });
  await ensureDirectoryExists(`src/types/`, fs);
  await parts.ifAsyncResult(({ flat }) => {
    const text = renderScalarType(documenterOptions, cdef, flat);
    return fs.writeFile(`src/types/${cdef.name.value}.md`, text);
  }, problems);
}

async function renderDocumenterFunctionType(
  lib: DyadLibrary,
  st: DocumenterPage,
  query: QueryHandler,
  fs: FileSystemInterface,
  problems: Problem[]
) {
  const entity = definitionEntity(lib.name, [], st.id);
  const node = query(getDefinitionNode(entity));
  const def = node.filter(
    isFunctionTypeDefinition,
    unexpected(entity, "a function type definition")
  );
  const cdef = def.unsafeCoerce();
  const flat = query(flattenDefinitionEntity(entity, new Set())).filter(
    isFunctionTypeDefinition,
    unexpected(entity, "a function type definition")
  );
  const parts = Result.combine({ flat });
  await ensureDirectoryExists(`src/types/`, fs);
  await parts.ifAsyncResult(({ flat }) => {
    const text = renderFunctionType(documenterOptions, cdef, flat);
    return fs.writeFile(`src/types/${cdef.name.value}.md`, text);
  }, problems);
}

async function renderDocumenterConnector(
  lib: DyadLibrary,
  comp: DocumenterPage,
  query: QueryHandler,
  fs: FileSystemInterface,
  problems: Problem[]
) {
  const entity = definitionEntity(lib.name, [], comp.id);
  const def = query(getDefinitionNode(entity)).filter(
    isConnectorDefinition,
    unexpected(entity, "a connector definition")
  );
  const adef = def.unsafeCoerce();

  const icon = await generateIcon({}, adef, adef.name.value, 0, query);
  switch (adef.kind) {
    case "sclcon": {
      await ensureDirectoryExists(`src/connectors/`, fs);
      const instance = instantiateScalarConnector(adef, null, adef.span);
      const parts = Result.combine({ instance, icon });
      await parts.ifAsyncResult(({ instance, icon }) => {
        const text = renderScalarConnector(
          documenterOptions,
          instance,
          adef,
          icon
        );
        return fs.writeFile(`src/connectors/${adef.name.value}.md`, text);
      }, problems);
      break;
    }
    case "strcon": {
      await ensureDirectoryExists(`src/connectors/`, fs);
      const instance = instantiateRecordConnector(adef, null, adef.span, query);
      const parts = Result.combine({ instance, icon });
      await parts.ifAsyncResult(({ icon, instance }) => {
        const text = renderStructureConnector(
          documenterOptions,
          instance,
          adef,
          icon
        );
        return fs.writeFile(`src/connectors/${adef.name.value}.md`, text);
      }, problems);
      break;
    }
    default:
      assertUnreachable(adef);
  }
  return problems;
}

async function renderDocumenterAnalysis(
  lib: DyadLibrary,
  comp: DocumenterPage,
  query: QueryHandler,
  fs: FileSystemInterface,
  problems: Problem[]
) {
  const entity = definitionEntity(lib.name, [], comp.id);
  const def = query(getDefinitionNode(entity)).filter(
    isAnalysisDefinition,
    unexpected(entity, "an analysis type definition")
  );
  const adef = def.unsafeCoerce();
  const instance = instantiateAnalysis(adef, {}, query);
  const parts = Result.combine({ instance });

  await ensureDirectoryExists(`src/analyses/`, fs);
  await parts.ifAsyncResult(({ instance }) => {
    const text = renderAnalysis(documenterOptions, instance, adef);
    return fs.writeFile(`src/analyses/${adef.name.value}.md`, text);
  }, problems);
}

async function renderDocumenterComponent(
  lib: DyadLibrary,
  comp: DocumenterPage,
  pages: DocumenterPages,
  query: QueryHandler,
  fs: FileSystemInterface,
  dir: string,
  options: NormalizedRenderOptions,
  problems: Problem[]
) {
  const entity = definitionEntity(lib.name, [], comp.id);
  const def = query(getDefinitionNode(entity)).filter(
    isComponentDefinition,
    unexpected(entity, "a component definition")
  );
  const cdef = def.unsafeCoerce();
  const flat = query(flattenDefinitionEntity(entity, new Set())).filter(
    isComponentDefinition,
    new CompilerAssertionError(
      entity,
      `Expected ${describeEntity(
        entity
      )} to be a component definition but it wasn't`
    )
  );

  const instance = instantiateModel(cdef, {}, null, query);
  const icon = await generateIcon({}, cdef, cdef.name.value, 0, query);
  const diagram = successfulResult(undefined);
  // TODO: Uncomment this once we can reliably know whether a coherent diagram is getting rendered.
  // const diagram = await generateDiagram(cdef.name.value, cdef, workspace);
  const parts = Result.combine({ flat, instance, icon, diagram });

  await ensureDirectoryExists(`src/${dir}/`, fs);
  await parts.ifAsyncResult(({ flat, instance, icon, diagram }) => {
    const idef = query(instance.def);

    const testof =
      pages.test_cross_references[idef.name.value] ?? new Set<string>();
    const testby = Object.entries(pages.test_cross_references)
      .filter(([_, comps]) => comps.has(idef.name.value))
      .map(([test]) => test);

    const tests = [...testof, ...testby].sort();

    const evalBlock = TestCasesSection(lib, instance, idef);

    const behavior = new Lines("");

    // TODO: Use a special annotation to populate `path` variables
    // for the purpose of rendering?
    if (
      instance.continuityGraph.length === 0 &&
      instance.definition_metadata.Dyad.doc.behavior
    ) {
      behavior.add("## Behavior");
      behavior.add("");
      const example_lines = [
        `using ${lib.name} #hide`,
        `using ModelingToolkit #hide`,
      ];
      const parameterNames: string[] = [];
      for (const [parameterName, param] of Object.entries(
        instance.parameters
      )) {
        if (!param.final) {
          example_lines.push(`@variables ${parameterName} #hide`);
          parameterNames.push(parameterName);
        }
      }
      example_lines.push(
        `@named sys = ${idef.name.value}(${parameterNames
          .map((n) => `${n}=${n}`)
          .join(", ")}) #hide`
      );
      example_lines.push(`full_equations(sys) #hide`);

      behavior.add(codeFence("@example behavior", example_lines.join("\n")));
    } else {
      behavior.add("## Behavior");
      behavior.add("");
      behavior.add(
        `Behavior of this component cannot be rendered because it includes ${inlineCode(
          "path"
        )} variables.`
      );
    }
    const text = renderComponentMarkdown(
      documenterOptions,
      instance,
      idef,
      flat,
      tests,
      {
        pre_source:
          instance.qualifier === "partial" ? undefined : behavior.toString(),
        pre_related: evalBlock,
      },
      query,
      icon,
      diagram
    );
    return fs.writeFile(`src/${dir}/${cdef.name.value}.md`, text.value);
  }, problems);
}

export function collectPages(lib: DyadLibrary, query: QueryHandler) {
  const root = lib.rootModule;
  const ret: DocumenterPages = {
    libraryName: lib.name,
    scalarTypes: [],
    functionTypes: [],
    partialTypes: [],
    structTypes: [],
    enumTypes: [],
    connectors: [],
    components: [],
    analyses: [],
    examples: [],
    experiments: [],
    tests: [],
    test_cross_references: {},
  };
  const page = (def: Definition): DocumenterPage => {
    const description = def.doc_string
      ? def.doc_string.value.split("\n")[0]
      : "";
    return { description, id: def.name.value };
  };
  for (const file of root.files) {
    if (isParsedFile(file)) {
      for (const def of file.definitions) {
        switch (def.kind) {
          case "adef":
            ret.analyses.push(page(def));
            break;
          case "cdef":
            switch (def.qualifier) {
              case "partial":
                ret.partialTypes.push(page(def));
                break;
              case "test": {
                const problems: Problem[] = [];
                const tinst = instantiateModel(def, {}, null, query);
                tinst.ifResult((inst) => {
                  for (const comp of Object.values(inst.components)) {
                    comp().ifResult((compi) => {
                      const cdef = query(compi.instance.def);
                      const list =
                        ret.test_cross_references[def.name.value] ??
                        new Set<string>();
                      list.add(cdef.name.value);
                      ret.test_cross_references[def.name.value] = list;
                    }, problems);
                  }
                }, problems);
                ret.tests.push(page(def));
                break;
              }
              case "example":
                ret.examples.push(page(def));
                break;
              default:
                ret.components.push(page(def));
                break;
            }
            break;
          case "enum":
            ret.enumTypes.push(page(def));
            break;
          case "fun":
            ret.functionTypes.push(page(def));
            break;
          case "scalar":
            ret.scalarTypes.push(page(def));
            break;
          case "sclcon":
          case "strcon":
            ret.connectors.push(page(def));
            break;
          case "struct":
            ret.structTypes.push(page(def));
            break;
          default:
            assertUnreachable(def);
        }
      }
    }
  }
  ret.analyses.sort(comparePages);
  ret.components.sort(comparePages);
  ret.connectors.sort(comparePages);
  ret.enumTypes.sort(comparePages);
  ret.examples.sort(comparePages);
  ret.experiments.sort(comparePages);
  ret.partialTypes.sort(comparePages);
  ret.scalarTypes.sort(comparePages);
  ret.functionTypes.sort(comparePages);
  ret.structTypes.sort(comparePages);
  ret.tests.sort(comparePages);
  return ret;
}

function pageList(
  cat: string,
  dir: string,
  names: DocumenterPage[],
  indent: string = ""
): string {
  return `${indent}"${cat}" => Any[${names
    .map((n) => `"${dir}/${n.id}.md"`)
    .join(", ")}],`;
}

export function generatePages(pages: DocumenterPages): string {
  const lines = new Lines("   ");
  lines.add(`"${pages.libraryName}" => "index.md",`);
  const types = allTypes(pages);
  if (types.length > 0) {
    lines.add(`"Types" => Any[`);
    if (pages.scalarTypes.length > 0) {
      lines.add(pageList("Scalar Types", "types", pages.scalarTypes, "  "));
    }
    if (pages.functionTypes.length > 0) {
      lines.add(pageList("Function Types", "types", pages.functionTypes, "  "));
    }
    if (pages.partialTypes.length > 0) {
      lines.add(pageList("Partial Types", "types", pages.partialTypes, "    "));
    }
    if (pages.enumTypes.length > 0) {
      lines.add(pageList("Enumerated Types", "types", pages.enumTypes, "    "));
    }
    if (pages.structTypes.length > 0) {
      lines.add(pageList("Struct Types", "types", pages.structTypes, "    "));
    }
    lines.add(`],`);
  }
  if (pages.connectors) {
    lines.add(pageList("Connectors", "connectors", pages.connectors));
  }
  if (pages.components) {
    lines.add(pageList("Components", "components", pages.components));
  }
  if (pages.analyses) {
    lines.add(pageList("Analyses", "analyses", pages.analyses));
  }
  if (pages.examples) {
    lines.add(pageList("Examples", "examples", pages.examples));
  }
  if (pages.experiments) {
    lines.add(pageList("Experiments", "experiments", pages.experiments));
  }
  if (pages.tests) {
    lines.add(pageList("Tests", "tests", pages.tests));
  }
  return `pages = [\n${lines.toString()}\n]`;
}

async function ensureDirectoryExists(dir: string, fs: FileSystemInterface) {
  if (await fs.exists(dir)) {
    return;
  }
  await fs.mkdir(dir, { recursive: true });
}
