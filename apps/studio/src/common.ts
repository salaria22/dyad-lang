// NB - will this work with cloud based extensions?  I would think so since
// this is running server side and that runs outside the browser.

export function requestName(req: string) {
  return `dyad/${req}` as const;
}

export function commandName(cmd: string) {
  return `dyad-studio.${cmd}` as const;
}

export const dyadSelector = "dyad";
