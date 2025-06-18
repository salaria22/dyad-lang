import {
  ASTNode,
  Assertion,
  ComponentDeclaration,
  Connection,
  ConnectionVariableDeclaration,
  DocString,
  EnumTypeDefinition,
  Equation,
  MetadataNode,
  ComponentDefinition,
  Modifications,
  ParsedFile,
  QualifiedType,
  RawFile,
  DyadLibrary,
  DyadModule,
  ScalarTypeDefinition,
  StructTypeDefinition,
  UsingStatement,
  VariableDeclaration,
  WorkspaceNode,
  nodeCase,
  StructFieldDeclaration,
  AnalysisDefinition,
  StructConnectorDefinition,
  ScalarConnectorDefinition,
  Transition,
  FunctionTypeDefinition,
  qualifiedName,
  ContinuitySet,
  AnalysisPoint,
  SwitchStatement,
  CaseClause,
  ElseIfClause,
  IfStatement,
  Expression,
  ForLoopStatement,
  Modification,
  hasExpression,
  hasNested,
} from "@juliacomputing/dyad-ast";
import { unparseExpression } from "./unparse_expr.js";
import { prettyPrint } from "./pretty.js";
import { Lines, Nullable } from "@juliacomputing/dyad-common";

export interface UnparseOptions {
  semanticOnly?: boolean;
  inline?: boolean;
  allowEmpty?: boolean;
}

export function unparseDyad(
  node: ASTNode,
  prefix: string = "",
  options?: UnparseOptions
): string {
  return nodeCase(node, {
    ap: unparseAnalysisPoint(prefix, options ?? {}),
    adef: unparseAnalysisDefinition(prefix, options ?? {}),
    assert: unparseAssertion(prefix, options ?? {}),
    casec: unparseCaseClause(prefix, options ?? {}),
    cdecl: unparseComponentDeclaration(prefix, options ?? {}),
    cdef: unparseComponentDefinition(prefix, options ?? {}),
    cont: unparseContinuitySet(prefix, options ?? {}),
    cvar: unparseConnectionVariableDeclaration(prefix, options ?? {}),
    cxn: unparseConnection(prefix, options ?? {}),
    elif: function (elif: ElseIfClause, context?: void | undefined): string {
      throw new Error("Function not implemented.");
    },
    eq: unparseEquation(prefix, options ?? {}),
    enum: unparseEnumTypeDefinition(prefix, options ?? {}),
    field: unparseStructFieldDeclaration(prefix, options ?? {}),
    file: unparseParsedFile(prefix, options ?? {}),
    forl: unparseForLoop(prefix, options ?? {}),
    fun: unparseFunctionTypeDefintion(prefix, options ?? {}),
    ifs: unparseIfStatement(prefix, options ?? {}),
    lib: (lib: DyadLibrary) => {
      throw new Error("Unable to 'unparse' a DyadLibrary");
    },
    module: (mod: DyadModule): string => {
      throw new Error("Unable to 'unparse' a DyadModule");
    },
    meta: unparseMetadata(prefix, options),
    raw: (file: RawFile) => file.content,
    scalar: unparseScalarTypeDefinition(prefix, options ?? {}),
    sclcon: unparseScalarConnectorDefinition(prefix, options ?? {}),
    strcon: unparseStructConnectorDefinition(prefix, options ?? {}),
    struct: unparseStructTypeDefinition(prefix, options ?? {}),
    st: unparseTransition(prefix, options ?? {}),
    sw: unparseSwitchStatement(prefix, options ?? {}),
    qtype: unparseQualifiedType(prefix),
    var: unparseVariableDeclaration(prefix, options ?? {}),
    using: unparseUsingStatement(prefix),
    workspace: (workspace: WorkspaceNode) => {
      throw new Error("Unable to 'unparse' a Workspace");
    },
  });
}

function endMetadata(
  meta: Nullable<MetadataNode>,
  prefix: string,
  options: UnparseOptions
): string[] {
  if (meta === null) {
    return [];
  } else {
    const result = unparseDyad(meta, "", { ...options, inline: true });
    const resultLines = result.split("\n");
    if (resultLines.length === 1) {
      return [`metadata ${result}`];
    }
    const mappedLines = resultLines.map((line, i) => {
      if (i === 0) {
        return `metadata ${line}`;
      } else if (i === resultLines.length - 1) {
        return `${line}`;
      } else {
        return `${line}`;
      }
    });
    return mappedLines;
  }
}

function attachedMetadata(
  meta: Nullable<MetadataNode>,
  options: UnparseOptions
) {
  if (meta === null || options.semanticOnly) {
    return "";
  }
  const result = unparseDyad(meta, "", { ...options, inline: true });
  const resultLines = result.split("\n");
  if (resultLines.length === 1) {
    return ` [${result}]`;
  }
  const lines = new Lines("");
  const mappedLines = resultLines.map((line, i) => {
    if (i === 0) {
      return ` [${line}`;
    } else if (i === resultLines.length - 1) {
      return `${line}]`;
    } else {
      return `${line}`;
    }
  });
  lines.add(...mappedLines);
  return lines.toString();
}

function unparseDocString(s: DocString): string[] {
  const lines = s.value.split("\n");
  return lines.map((line) => (line === "" ? `#` : `# ${line}`));
}

function unparseModification(mod: Modification): string {
  let nested = "";
  if (mod.nested !== null) {
    const sub = unparseModifications(mod.nested);
    nested = `(${sub})`;
  }
  // const nested =
  //   mod.nested === null ? "" : `(${unparseModifications(mod.nested)})`;
  const assign = mod.expr === null ? "" : `=${unparseExpression(mod.expr)}`;
  return `${nested}${assign}`;
}

function unparseModifications(mods: Modifications): string {
  const entries = Object.entries(mods);
  const defined = entries.filter(
    (x) =>
      !(hasExpression(x[1]) && x[1].expr.type === "ulit") || hasNested(x[1])
  );
  return defined
    .map(([k, v]) => `${v.final ? "final " : ""}${k}${unparseModification(v)}`)
    .join(", ");
}

function unparseAnalysisDefinition(prefix: string, options: UnparseOptions) {
  return (adef: AnalysisDefinition): string => {
    const lines = new Lines(prefix);
    if (adef.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(adef.doc_string));
    }
    lines.add(`analysis ${adef.name.value}`);
    lines.add(`  extends ${unparseDyad(adef.extends, prefix + "  ", options)}`);
    lines.add(
      ...Object.entries(adef.declarations).map((e) =>
        unparseDyad(e[1], prefix + "  ")
      )
    );
    const relations = adef.relations;

    if (relations.length > 0) {
      lines.add("relations");
      lines.add(
        ...relations.map((rel) => unparseDyad(rel, prefix + "  ", options))
      );
    }
    if (!options.semanticOnly) {
      lines.add(...endMetadata(adef.metadata, prefix, options));
    }
    lines.add(`end`);
    return lines.toString();
  };
}

function unparseComponentDeclaration(prefix: string, options: UnparseOptions) {
  return (decl: ComponentDeclaration): string => {
    const lines = new Lines(prefix);
    if (decl.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(decl.doc_string));
    }
    let type = "";
    if (decl.constraint !== null) {
      const subs = decl.dims.map((x) => `[${unparseExpression(x)}]`).join("");
      type = `::${unparseDyad(decl.constraint, "", options)}${subs}`;
    }
    const meta = attachedMetadata(decl.metadata, options);
    let instance = unparseDyad(decl.instance, "", options);
    if (decl.indices.length > 0) {
      instance = `[${instance} ${decl.indices
        .map(
          (index) =>
            `for ${index.variable} in ${unparseExpression(index.range)}`
        )
        .join(", ")}]`;
    }
    const cond = decl.cond ? ` if ${unparseExpression(decl.cond)}` : "";
    lines.add(`${decl.name.value}${type} = ${instance}${cond}${meta}`);
    return lines.toString();
  };
}

function unparseComponentDefinition(prefix: string, options: UnparseOptions) {
  return (cdef: ComponentDefinition): string => {
    const lines = new Lines(prefix);
    if (cdef.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(cdef.doc_string));
    }
    const qualifier = cdef.qualifier ? `${cdef.qualifier} ` : "";
    lines.add(`${qualifier}component ${cdef.name.value}`);
    lines.add(
      ...cdef.extends.map((e) => `  extends ${unparseDyad(e, prefix + "  ")}`)
    );
    lines.add(
      ...Object.entries(cdef.declarations).map((e) =>
        unparseDyad(e[1], prefix + "  ", options)
      )
    );
    const relations = cdef.relations;

    if (relations.length > 0) {
      lines.add("relations");
      lines.add(
        ...relations.map((rel) => unparseDyad(rel, prefix + "  ", options))
      );
    }
    if (!options.semanticOnly) {
      lines.add(...endMetadata(cdef.metadata, prefix, options));
    }
    lines.add(`end`);
    return lines.toString();
  };
}

function unparseContinuitySet(prefix: string, options: UnparseOptions) {
  return (connection: ContinuitySet): string => {
    const lines = new Lines(prefix);
    if (connection.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(connection.doc_string));
    }
    const meta = attachedMetadata(connection.metadata, options);
    lines.add(
      `continuity(${connection.variables
        .map(unparseExpression)
        .join(", ")})${meta}`
    );
    return lines.toString();
  };
}

function unparseDimensions(dims: Array<Expression>) {
  if (dims.length === 0) {
    return "";
  }
  return `[${dims.map(unparseExpression).join(", ")}]`;
}

function unparseConnectionVariableDeclaration(
  prefix: string,
  options: UnparseOptions
) {
  return (decl: ConnectionVariableDeclaration): string => {
    const lines = new Lines(prefix);

    if (decl.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(decl.doc_string));
    }

    const subs = unparseDimensions(decl.dims);
    const tokens: string[] = [];
    tokens.push(decl.qualifier);
    const meta = attachedMetadata(decl.metadata, options);
    tokens.push(
      `${decl.name.value}::${unparseDyad(decl.type, "", options)}${subs}${meta}`
    );
    lines.add(tokens.join(" "));
    return lines.toString();
  };
}

function unparseAnalysisPoint(prefix: string, options: UnparseOptions) {
  return (ap: AnalysisPoint): string => {
    const lines = new Lines(prefix);
    if (ap.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(ap.doc_string));
    }
    const meta = attachedMetadata(ap.metadata, options);
    lines.add(
      `${ap.name.value}: analysis_point(${ap.connectors
        .map(unparseExpression)
        .join(", ")})${meta}`
    );
    return lines.toString();
  };
}

function unparseConnection(prefix: string, options: UnparseOptions) {
  return (connection: Connection): string => {
    const lines = new Lines(prefix);
    if (connection.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(connection.doc_string));
    }
    const meta = attachedMetadata(connection.metadata, options);
    lines.add(
      `connect(${connection.connectors
        .map(unparseExpression)
        .join(", ")})${meta}`
    );
    return lines.toString();
  };
}

function unparseAssertion(prefix: string, options: UnparseOptions) {
  return (assertion: Assertion): string => {
    const lines = new Lines(prefix);
    if (assertion.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(assertion.doc_string));
    }
    lines.add(
      `assert(${unparseExpression(assertion.expr)}, "${assertion.message}")`
    );
    return lines.toString();
  };
}

function unparseEquation(prefix: string, options: UnparseOptions) {
  return (equation: Equation): string => {
    const lines = new Lines(prefix);
    if (equation.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(equation.doc_string));
    }
    const initial = equation.initial ? `initial ` : "";
    const name = equation.name ? `${equation.name.value}: ` : "";
    const meta = attachedMetadata(equation.metadata, options);
    lines.add(
      `${initial}${name}${unparseExpression(
        equation.lhs
      )} = ${unparseExpression(equation.rhs)}${meta}`
    );
    return lines.toString();
  };
}

function unparseEnumTypeDefinition(prefix: string, options: UnparseOptions) {
  return (def: EnumTypeDefinition): string => {
    const lines = new Lines(prefix);
    if (def.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(def.doc_string));
    }
    lines.add(`enum ${def.name.value} =`);
    for (const [key, val] of Object.entries(def.cases)) {
      const args: string[] = Object.entries(val.fields).map(([name, decl]) => {
        return `${name}::${unparseDyad(decl.type)}`;
      });

      if (args.length === 0) {
        lines.add(`  | ${key}`);
      } else {
        lines.add(`  | ${key}(${args.join(", ")})`);
      }
    }
    return lines.toString();
  };
}

function unparseStructFieldDeclaration(
  prefix: string,
  options: UnparseOptions
) {
  return (field: StructFieldDeclaration): string => {
    const lines = new Lines(prefix);
    if (field.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(field.doc_string));
    }
    const subs = unparseDimensions(field.dims);
    const meta = attachedMetadata(field.metadata, options);
    const init = field.init ? ` = ${unparseExpression(field.init)}` : "";
    lines.add(
      `${field.name.value}::${unparseDyad(
        field.type,
        "",
        options
      )}${subs}${init}${meta}`
    );
    return lines.toString();
  };
}

function unparseFunctionTypeDefintion(prefix: string, options: UnparseOptions) {
  return (f: FunctionTypeDefinition): string => {
    const lines = new Lines(prefix);
    if (f.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(f.doc_string));
    }

    const pos = f.positional.map((x) => `::${qualifiedName(x)}`).join(", ");
    const kwargs = Object.entries(f.keyword)
      .map(([k, v]) => `${k}::${qualifiedName(v)}`)
      .join(", ");
    const ret =
      f.returns.length === 1
        ? `::${qualifiedName(f.returns[0])}`
        : `::(${f.returns.map((x) => `::${qualifiedName(x)}`).join(", ")})`;
    if (pos.length === 0) {
      if (kwargs.length === 0) {
        lines.add(`type ${f.name.value} = func()${ret}`);
        return lines.toString();
      }
      lines.add(`type ${f.name.value} = func(; ${kwargs})${ret}`);
      return lines.toString();
    }
    if (kwargs.length === 0) {
      lines.add(`type ${f.name.value} = func(${pos})${ret}`);
      return lines.toString();
    }
    lines.add(`type ${f.name.value} = func(${pos}; ${kwargs})${ret}`);
    return lines.toString();
  };
}

function unparseParsedFile(prefix: string, options: UnparseOptions) {
  return (file: ParsedFile): string => {
    const lines = new Lines(prefix);
    lines.add(...file.uses.map((u) => unparseDyad(u, "", options)));
    if (file.uses.length > 0 && file.definitions.length > 0) {
      lines.add("");
    }
    lines.add(
      ...file.definitions.map(
        (def, i) =>
          unparseDyad(def, prefix, options) +
          (i === file.definitions.length - 1 ? "" : "\n")
      )
    );
    return lines.toString();
  };
}

function unparseMetadata(prefix: string, options?: UnparseOptions) {
  return (meta: MetadataNode): string => {
    const ret = prettyPrint(
      meta.value,
      {
        indent: "  ",
        singleQuotes: false,
        inlineCharacterLimit: options?.inline ? 80 : undefined,
      },
      prefix
    );
    return ret;
  };
}

function unparseScalarConnectorDefinition(
  prefix: string,
  options: UnparseOptions
) {
  return (def: ScalarConnectorDefinition): string => {
    const lines = new Lines(prefix);
    if (def.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(def.doc_string));
    }
    const meta =
      def.metadata && !options.semanticOnly
        ? ` ${endMetadata(def.metadata, prefix, options).join("")}`
        : "";
    lines.add(
      `connector ${def.name.value} = ${def.qualifier} ${unparseDyad(
        def.type,
        prefix,
        {
          ...options,
          allowEmpty: true,
        }
      )}${meta}`
    );
    return lines.toString();
  };
}

function unparseScalarTypeDefinition(prefix: string, options: UnparseOptions) {
  return (def: ScalarTypeDefinition): string => {
    const lines = new Lines(prefix);
    if (def.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(def.doc_string));
    }
    lines.add(
      `type ${def.name.value} = ${unparseDyad(def.base, prefix, {
        ...options,
        allowEmpty: true,
      })}`
    );
    return lines.toString();
  };
}

function unparseStructConnectorDefinition(
  prefix: string,
  options: UnparseOptions
) {
  return function (def: StructConnectorDefinition): string {
    const lines = new Lines(prefix);
    if (def.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(def.doc_string));
    }
    lines.add(`connector ${def.name.value}`);
    lines.add(
      ...Object.entries(def.elements).map((e) =>
        unparseDyad(e[1], prefix + "  ", options)
      )
    );
    if (!options.semanticOnly) {
      lines.add(...endMetadata(def.metadata, prefix, options));
    }
    lines.add(`end`);
    return lines.toString();
  };
}

function unparseStructTypeDefinition(prefix: string, options: UnparseOptions) {
  return (def: StructTypeDefinition): string => {
    const lines = new Lines(prefix);
    if (def.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(def.doc_string));
    }
    lines.add(`struct ${def.name.value}`);
    lines.add(
      ...Object.entries(def.fields).map((field) =>
        unparseDyad(field[1], prefix + "  ", options)
      )
    );
    lines.add(`end`);
    return lines.toString();
  };
}

function unparseCaseClause(prefix: string, options: UnparseOptions) {
  return (casec: CaseClause): string => {
    const lines = new Lines(prefix);
    if (casec.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(casec.doc_string));
    }
    if (casec.caseid.value === "default") {
      lines.add(`default`);
    } else {
      lines.add(`case ${casec.caseid.value}`);
    }
    for (const r of casec.rels) {
      lines.add(unparseDyad(r, "  "));
    }
    if (!options.semanticOnly) {
      lines.add(...endMetadata(casec.metadata, prefix, options));
    }
    lines.add(`end`);
    const ret = lines.toString();
    return ret;
  };
}

function unparseIfStatement(prefix: string, options: UnparseOptions) {
  return (ifs: IfStatement): string => {
    const lines = new Lines(prefix);
    if (ifs.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(ifs.doc_string));
    }

    lines.add(`if ${unparseExpression(ifs.cond)}`);
    for (const rel of ifs.yes) {
      lines.add(unparseDyad(rel, "  "));
    }
    for (const clause of ifs.elif) {
      lines.add(`elseif ${unparseExpression(clause.cond)}`);
      for (const rel of clause.rels) {
        lines.add(unparseDyad(rel, "  "));
      }
    }
    lines.add(`else`);
    for (const rel of ifs.no) {
      lines.add(unparseDyad(rel, "  "));
    }
    lines.add(`end`);

    return lines.toString();
  };
}

function unparseForLoop(prefix: string, options: UnparseOptions) {
  return (forl: ForLoopStatement): string => {
    const lines = new Lines(prefix);
    if (forl.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(forl.doc_string));
    }
    const indices = forl.indices
      .map(
        (index) => `for ${index.variable} in ${unparseExpression(index.range)}`
      )
      .join(", ");
    lines.add(`${indices}`);
    for (const rel of forl.relations) {
      lines.add(unparseDyad(rel, "  "));
    }
    lines.add(`end`);
    return lines.toString();
  };
}

function unparseSwitchStatement(prefix: string, options: UnparseOptions) {
  return (sw: SwitchStatement): string => {
    const lines = new Lines(prefix);
    if (sw.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(sw.doc_string));
    }
    lines.add(`switch ${unparseExpression(sw.val)}`);
    for (const c of sw.cases) {
      const item = unparseDyad(c, "  ");
      lines.add(item);
    }
    if (!options.semanticOnly) {
      lines.add(...endMetadata(sw.metadata, prefix, options));
    }
    lines.add(`end`);
    return lines.toString();
  };
}

function unparseTransition(prefix: string, options: UnparseOptions) {
  return (transition: Transition): string => {
    const meta = attachedMetadata(transition.metadata, options);
    return `transition(${unparseExpression(
      transition.from
    )} => ${unparseExpression(transition.to)}, ${unparseExpression(
      transition.cond
    )})${meta}`;
  };
}

function unparseQualifiedType(prefix: string) {
  return function (qual: QualifiedType): string {
    if (qual.mods === null) {
      return `${qualifiedName(qual)}`;
    }
    return `${qualifiedName(qual)}(${unparseModifications(qual.mods)})`;
  };
}

function unparseVariableDeclaration(prefix: string, options: UnparseOptions) {
  return function (v: VariableDeclaration): string {
    const lines = new Lines(prefix);
    if (v.doc_string && !options.semanticOnly) {
      lines.add(...unparseDocString(v.doc_string));
    }
    const final = v.final ? `final ` : ``;
    const init = v.init ? ` = ${unparseExpression(v.init)}` : "";
    const type = unparseDyad(v.type, prefix, {
      ...options,
      allowEmpty: true,
    });
    const subs =
      v.dims.length === 0
        ? ""
        : "[" +
          v.dims
            .map((dim) => (dim.type === "ulit" ? ":" : unparseExpression(dim)))
            .join(",") +
          "]";
    const cond = v.cond ? ` if ${unparseExpression(v.cond)}` : "";
    const qualifier =
      v.variability === "structural" ? "structural parameter" : v.variability;
    lines.add(
      `${final}${qualifier} ${v.name.value}::${type}${subs}${init}${cond}`
    );
    return lines.toString();
  };
}

function unparseUsingStatement(prefix: string) {
  return function (v: UsingStatement): string {
    const symbols =
      v.symbols.length === 0
        ? ""
        : `: ${v.symbols
            .map((x) => {
              return x.type
                ? `${x.symbol.value}::${unparseDyad(x.type, prefix)}`
                : x.symbol.value;
            })
            .join(", ")}`;
    return `using ${v.module.value}${symbols}`;
  };
}
