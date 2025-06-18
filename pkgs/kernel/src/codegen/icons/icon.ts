import {
  Definition,
  FileLevelNode,
  MetadataNode,
  isComponentDefinition,
  isDefinition,
} from "@juliacomputing/dyad-ast";
import { problemSpan, QueryHandler } from "../../workspace/index.js";
import { instantiateModel } from "../../instantiate/index.js";
import {
  dyadDefinition,
  normalizeDefinition,
} from "../../metadata/definition.js";
import { connectorLayer } from "./layers.js";
import {
  Nullable,
  Problem,
  buf2str,
  createError,
  Result,
  partialResult,
  successfulResult,
} from "@juliacomputing/dyad-common";
import { zodIssue2Problem } from "../../metadata/issues.js";
import { defaultIcon } from "../../metadata/default_icons.js";
import { labelGraphics } from "./component.js";
import { renderLabel } from "./render.js";
import { unparseMTKExpression } from "../equation.js";

const IconNotFound = createError("icon-not-found", "Icon Not Found");
const UnsupportedContentType = createError(
  "unsupported-content-type",
  "Unsupported Content Type"
);
/**
 * The purpose of this function is to generate the icon "markup" for a given
 * model definition.  Currently, the assumption is that this "markup" is in
 * SVG although something like web components could be used here as well since
 * the assumption is that this will be injected into the DOM.
 *
 * @param def Definition whose icon is being requested
 * @param iconName The name of the icon to render (a given definition may have multiple)
 * @param workspace The workspace that this definition is managed in
 * @param visited The set of all model definitions already called (to avoid infinite recursion)
 * @returns
 */
export async function generateIcon(
  substitutions: Record<string, string>,
  def: Definition,
  iconName: string,
  baserot: number,
  query: QueryHandler
): Promise<Result<string>> {
  const entries: string[] = [];
  const subs = { ...substitutions };
  const problems: Array<Problem<unknown>> = [];

  // Inject this components icon as the "backdrop" for the icon
  (await getIcon(def.name.value, def, def.metadata, iconName, query)).map(
    (myIcon) =>
      entries.push(
        `<g transform="translate(0 0) scale(1.0) rotate(0)" transform-origin="center center">${myIcon}</g>`
      )
  );

  if (isComponentDefinition(def)) {
    const rp = instantiateModel(def, {}, null, query);
    const vr = await rp.mapAsync(async (instance) => {
      // Then inject the icon for all the connectors.
      // FIX: Use Promise.all()
      (await connectorLayer(instance, baserot, query)).ifResult((lines) => {
        entries.push(...lines);
      }, problems);

      for (const [pn, p] of Object.entries(instance.parameters)) {
        p.default.ifJust((e) => (subs[pn] = unparseMTKExpression(e)));
        if (subs[pn] === undefined) {
          subs[pn] = `$(${pn})`;
        }
      }
    });
    problems.push(...vr.problems());
  }

  if (isDefinition(def)) {
    const metadata = dyadDefinition
      .passthrough()
      .safeParse(def.metadata ? def.metadata.value : {});
    const norm = normalizeDefinition(metadata.success ? metadata.data : {});

    for (const label of labelGraphics(subs, norm, "icon")) {
      entries.push(renderLabel(label, baserot));
    }
  }

  // Now wrap it all in an SVG wrapper
  const ret = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000"
    overflow="visible" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
    <style>
    text {
      transform-origin: center center;
    }
    </style>${entries.join("\n")}
    </svg>`;

  return partialResult(ret, ...problems);
}

const issueMap = zodIssue2Problem("getIcon", "definition");

export async function getIcon(
  context: string,
  parent: FileLevelNode,
  metadata: Nullable<MetadataNode>,
  iconName: string,
  query: QueryHandler
): Promise<Result<string>> {
  /** If there is no metadata at all, return default icon */
  if (metadata === null) {
    return successfulResult(defaultIcon);
  }

  /** Validate metadata against expected schema */
  const validated = dyadDefinition.safeParse(metadata ? metadata.value : {});
  if (!validated.success) {
    const problems = validated.error.issues.map((x) =>
      issueMap(x, problemSpan(parent, metadata.span))
    );

    return partialResult(defaultIcon, ...problems);
  }
  const defmeta = normalizeDefinition(validated.data);
  let iconUrl: string | undefined = defmeta.Dyad.icons[iconName];
  const problems: Problem[] = [];
  if (iconUrl === undefined) {
    problems.push(
      new IconNotFound(
        iconName,
        `Icon ${iconName} in ${context} not found in metadata`
      )
    );
    const entries = Object.entries(defmeta.Dyad.icons);
    if (entries.length === 0) {
      return partialResult(defaultIcon, ...problems);
    }
    iconUrl = entries[0][1];
  }
  if (iconUrl === undefined) {
    return partialResult(defaultIcon, ...problems);
  }

  const iconToUse = iconUrl;

  const contents = query(({ fetch }) => fetch(iconUrl));
  if (!contents.hasValue()) {
    return partialResult(defaultIcon, ...contents.problems());
  }
  const v = contents.value;
  if (v.contentType.startsWith("image/svg")) {
    return successfulResult(buf2str(v.contents));
  }
  return partialResult(
    defaultIcon,
    new UnsupportedContentType(
      iconToUse,
      `Unable to handle content type ${v.contentType} for ${iconUrl}, using default icon`
    )
  );
}
