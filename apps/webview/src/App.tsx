import { useState } from "react";
import { useEventListener } from "usehooks-ts";
import { Mermaid } from "./components/mermaid.js";
import { DetailsMessage, caseOfMessage } from "@juliacomputing/dyad-protocol";
import { Just, Maybe, Nothing } from "purify-ts/Maybe";
import { Diagram } from "./components/diagram.js";

window.addEventListener("message", (ev) => {
  console.log("Global event listener got:");
  console.log(ev);
});
export function App() {
  const [message, setMessage] = useState<Maybe<DetailsMessage>>(Nothing);

  useEventListener("message", (ev: MessageEvent<DetailsMessage>) => {
    console.log("Hook listener got:");
    console.log(ev);
    setMessage(Just(ev.data));
  });

  return message.caseOf({
    Nothing: () => null,
    Just: (v) =>
      caseOfMessage(v, {
        mermaid: (chart) => <Mermaid id="mermaid1" chart={chart} />,
        diagram: (svg) => <Diagram svg={svg} />,
        source: (code) => <pre style={{ color: "black" }}>{code}</pre>,
      }),
  });
}
