import { assertUnreachable } from "@juliacomputing/dyad-common";

export interface DiagramMessage {
  kind: "diagram";
  svg: string;
}

export interface MermaidMessage {
  kind: "mermaid";
  chart: string;
}

export interface SourceMessage {
  kind: "source";
  code: string;
}

export type DetailsMessage = DiagramMessage | MermaidMessage | SourceMessage;

export interface SelectionNotification {
  kind: "selection";
  path: string;
}

export function selectionNotification(path: string): SelectionNotification {
  return {
    kind: "selection",
    path,
  };
}

export function isSelection(x: unknown): x is SelectionNotification {
  return (
    typeof x === "object" && x !== null && "kind" in x && x.kind === "selection"
  );
}

export type DetailsNotification = SelectionNotification;

export interface MessageCases<T> {
  mermaid: (chart: string) => T;
  diagram: (svg: string) => T;
  source: (code: string) => T;
}

export function caseOfMessage<T>(
  msg: DetailsMessage,
  cases: MessageCases<T>
): T {
  switch (msg.kind) {
    case "mermaid":
      return cases.mermaid(msg.chart);
    case "diagram":
      return cases.diagram(msg.svg);
    case "source":
      return cases.source(msg.code);
    default:
      assertUnreachable(msg);
  }
}
