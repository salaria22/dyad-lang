/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";

import { generateCstDts } from "chevrotain";

// import { productions, jsonProductions, expressionProductions } from "..";
import { fileURLToPath } from "url";
import { jsonProductions } from "../parser/metadata_parser.js";
import { expressionProductions } from "../parser/expr_parser.js";
import { productions } from "../parser/parse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dtsString = generateCstDts(productions, {
  visitorInterfaceName: "DyadNodeVisitor",
});
const dtsPath = resolve(__dirname, "..", "parser", "dyad_cst.ts");
writeFileSync(dtsPath, dtsString);

const jsonDtsString = generateCstDts(jsonProductions(), {
  visitorInterfaceName: "JsonNodeVisitor",
});
const jsonDtsPath = resolve(__dirname, "..", "parser", "json_cst.ts");
writeFileSync(jsonDtsPath, jsonDtsString);

const exprDtsString = generateCstDts(expressionProductions(), {
  visitorInterfaceName: "ExpressionNodeVisitor",
});
const exprDtsPath = resolve(__dirname, "..", "parser", "expr_cst.ts");
writeFileSync(exprDtsPath, exprDtsString);
