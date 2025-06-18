var nodeCounter = 1;
import { ASTNode } from "@juliacomputing/dyad-ast";
import { Lines } from "@juliacomputing/dyad-common";
import lodash from "lodash";

function formatEllipsizedText(text: string, maxLength: number) {
  if (text.length > maxLength - 1) {
    return text.substring(0, maxLength - 1) + "…";
  } else {
    return text;
  }
}

function json2gvLabel(obj: Record<string, any>) {
  return lodash
    .map(lodash.keys(obj), function (key) {
      return "<" + key + "> " + key;
    })
    .join("|");
}

export function visualizeAST(node: ASTNode): string {
  var edges: Array<{ from: string | number; to: number }> = [];
  var nodes: Array<{ id: number; label: string }> = [];

  function recurse(parentNode: string | number, obj: {}) {
    var myId = nodeCounter++;
    edges.push({ from: parentNode, to: myId });
    if (lodash.isArray(obj)) {
      nodes.push({ id: myId, label: "array" });
      recurse(myId, obj[0]);
    } else if (!lodash.isObject(obj)) {
      nodes.push({
        id: myId,
        label: formatEllipsizedText("" + JSON.stringify(obj), 50),
      });
    } else {
      nodes.push({ id: myId, label: json2gvLabel(obj) });
      lodash.each(obj, function (v, k) {
        recurse(myId + ":" + k, v);
      });
    }
  }

  recurse("root", node);

  const lines = new Lines("");

  lines.add("digraph g {");
  lines.add('graph [rankdir = "LR", nodesep=0.1, ranksep=0.3];');
  lines.add(
    'node [fontsize = "16", shape = "record", height=0.1, color=lightblue2];'
  );
  lines.add("edge [];");

  lodash.map(nodes, function (n) {
    lines.add(n.id + '[label="' + n.label + '"];');
  });
  lodash.map(edges, function (e) {
    lines.add(e.from + "->" + e.to + ";");
  });

  lines.add("}");
  return lines.toString();
}
