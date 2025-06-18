export interface MTKCodeGenerationOptions {
  includeUnits: boolean;
}

export function normalizeMTKCGOptions(
  opts: Partial<MTKCodeGenerationOptions>
): MTKCodeGenerationOptions {
  return {
    includeUnits: opts.includeUnits ?? false,
  };
}
