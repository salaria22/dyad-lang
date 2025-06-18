import { allTokens } from "./dyad_tokens.js";

import { Lexer } from "chevrotain";

export const DyadLexer = new Lexer(allTokens);
