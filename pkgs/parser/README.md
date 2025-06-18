## Overview

This is a `chevrotain` parser that automatically generates a concrete syntax
tree (which can then be transformed into an abstract syntax tree using the
`ASTBuilder` found in `../builder`, [see here](../builder/README.md) for more
details).

## Parser Architecture

The main parser here is in `dyad_parser.ts`. But I've modularized the
parser in an unorthodox way. I didn't want to use conventional class
inheritance so I "tricked" Chevrotain into allowing me to create three distinct
parsers:

- Dyad - the main parser
- JSON - Used to parse JSON
- Expression - the expression parsing rules

The `DyadParser` is the main parser. But in incorporates the JSON parsing
rules via the `addJson` function and the expression parsing rules via the
`addExpression` function. Most of the rules are encapsulated inside those
functions. In the case of expressions, two rules are returned from the function
so they can be referenced in the `DyadParser`. In the case of JSON, only one
rule, the `object` rule, is returned and incorporated into the `DyadParser`.

However, because there is a link between these grammars, when I generate the set
of productions (rules) for any given subset, I am then able to generate the
TypeScript types associated with all the nodes, their children and their visitor
interfaces. These are found in `expr_cst.d.mts`, `json_cst.d.mts` and
`remove_cst.d.mts`. These files are produced by the code found in
`<root>/scripts/gendts.mts.`

All these parsers share the same tokens which are defined in
`dyad_tokens.mts`.

Considerable additional discussion about parsing, concrete syntax and abstraact
syntax can be found in the `../builder` directory and, specifically, in the
[`ASTBuilder` documentation](../builder/README.md).
