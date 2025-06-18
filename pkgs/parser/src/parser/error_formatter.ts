import type { IToken } from "chevrotain";

export function formatDyadError(
    sourceCode: string,
    filePath: string,
    errorTitle: string, // Added: e.g., "Parsing Error", "Lexical Error"
    baseErrorMessage: string,
    token: IToken,
    packageName?: string, // Optional package name
    options?: {
        contextLinesBefore?: number;
        contextLinesAfter?: number;
        context?: boolean;
    }
): string {
    // Default values for options
    const contextLinesBefore = options?.contextLinesBefore ?? 2;
    const contextLinesAfter = options?.contextLinesAfter ?? 2;
    const context = options?.context ?? true;

    if (!context) {
        return `\n${errorTitle}: ${baseErrorMessage}\n;`;
    }

    const lines = sourceCode.split('\n');
    const errorLineNumber = token.startLine || 0; // 1-indexed
    const errorColumn = token.startColumn || 0;   // 1-indexed
    
    // These are tunable constants for the number of lines of context to display
    // maybe these should be input instead?

    let output = `\n${errorTitle}: ${baseErrorMessage}\n`;
    if (filePath) {
        // Include package name if available
        const locationPrefix = packageName ? `${packageName}:` : '';
        output += `--> ${locationPrefix}${filePath}:${errorLineNumber}:${errorColumn}\n`;
    } else {
        output += `--> (source location unavailable):${errorLineNumber}:${errorColumn}\n`;
    }

    const startDisplayLine = Math.max(1, errorLineNumber - contextLinesBefore);
    const endDisplayLine = Math.min(lines.length, errorLineNumber + contextLinesAfter);
    
    // Determine the maximum line number string length for padding
    const maxLineNumStrLength = String(endDisplayLine).length;

    for (let i = startDisplayLine; i <= endDisplayLine; i++) {
        const currentLineStr = String(i).padStart(maxLineNumStrLength, ' ');
        const lineContent = lines[i - 1];
        output += `  ${currentLineStr} | ${lineContent}\n`;
        if (i === errorLineNumber) {
            let pointer = ''.padStart(maxLineNumStrLength + 3 + errorColumn -1 , ' '); // +3 for " | " and -1 for 0-indexed col
            pointer += '^';
            const tokenLength = token.image?.length || 1;
            for (let j = 0; j < tokenLength - 1; j++) {
                pointer += '~';
            }
            output += `${pointer}\n`;
        }
    }
    if (startDisplayLine > 1) {
        // Visual break if we skipped lines at the beginning
        const prefix = ''.padStart(maxLineNumStrLength, ' ');
        output = output.replace(`  ${String(startDisplayLine).padStart(maxLineNumStrLength, ' ')} |`, `  ${prefix} :\n  ${String(startDisplayLine).padStart(maxLineNumStrLength, ' ')} |`);
    }
    if (endDisplayLine < lines.length) {
        // Visual break if we skipped lines at the end
        const prefix = ''.padStart(maxLineNumStrLength, ' ');
        output += `  ${prefix} :\n`;
    }


    return output;
} 