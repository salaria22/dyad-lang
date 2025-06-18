import { Lines } from "@juliacomputing/dyad-common";

const tripleTick = "```";

export const dyadCodeFenceLanguage = "dyad";

export function codeFence(type: string, code: string) {
  const lines = new Lines("");
  lines.add(`${tripleTick}${type}`);
  lines.add(code);
  lines.add(`${tripleTick}`);
  return lines.toString();
}

export function inlineCode(str: string) {
  return "`" + str + "`";
}

export function itemList(str: string[]) {
  switch (str.length) {
    case 0:
      throw new Error("Empty item list!");
    case 1:
      return str[0];
    default:
      const last = str.at(-1);
      const others = str.slice(0, str.length - 1);
      return `${others.join(", ")} and ${last}`;
  }
}
