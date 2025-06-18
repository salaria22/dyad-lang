import { Nullable } from "@juliacomputing/dyad-common";
import { TextualSpan } from "./span";

/**
 * This type represents a simple token (string) but includes the span of that
 * token within the enclosing file.
 *
 * @category Structured Data
 */
export interface Token {
  value: string;
  span: Nullable<TextualSpan>;
}
/**
 * Create an instance of `Token`
 *
 * @category Structured Data
 *
 * @param value The string value of the token
 * @param span The span of the token
 * @returns
 */
export function createToken(value: string, span: Nullable<TextualSpan>): Token {
  return { value, span };
}
