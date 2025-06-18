/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";

import { createSyntaxDiagramsCode } from "chevrotain";

import { DyadParser } from "../parser/dyad_parser.js";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const parserInstance = new DyadParser();
const serializedGrammar = parserInstance.getSerializedGastProductions();

// create the HTML Text
const htmlText = createSyntaxDiagramsCode(serializedGrammar);

// Write the HTML file to disk
const outPath = resolve(__dirname, "./");
writeFileSync(outPath + "/generated_diagrams.html", htmlText);
