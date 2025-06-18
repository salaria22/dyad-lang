/* eslint-disable no-unused-vars */
// @ts-nocheck
import Handlebars from "handlebars";
export const templates = {
  component: Handlebars.template({
    compiler: [8, ">= 4.3.0"],
    main: function (container, depth0, helpers, partials, data) {
      return '"""\n   Reservoir(; name, p0)\n\n## Parameters: \n\n| Name         | Description                         | Units  |   Default value |\n| ------------ | ----------------------------------- | ------ | --------------- |\n| \\`p0\\`         |                          | Pa  |    |\n\n## Connectors\n\n * \\`port\\` - ([\\`HydraulicPort\\`](@ref))\n\n## Variables\n\n| Name         | Description                         | Units  | \n| ------------ | ----------------------------------- | ------ | \n| \\`rho\\`         |                          | kg/m3  | \n"""\n@component function Reservoir(; name, p0=nothing, continuity__graph0)\n  params = @parameters begin\n    (p0::Float64 = p0)\n    (rho0::Float64 = density(port__medium, p0))\n    (port__medium::MediumModel = continuity__graph0)\n  end\n  vars = @variables begin\n    (rho(t))\n  end\n  systems = @named begin\n    port = CommonTests.HydraulicPort()\n  end\n  defaults = Dict([\n  ])\n  eqs = Equation[\n    # This equation is here just to reference common variables on the connector\n    rho ~ density(port__medium, port.p)\n    port.p ~ p0\n  ]\n  return ODESystem(eqs, t, vars, params; systems, defaults, name)\nend\nexport Reservoir\nBase.show(io::IO, a::MIME"image/svg+xml", t::typeof(Reservoir)) = print(io,\n  """<div style="height: 100%; width: 100%; background-color: white"><div style="margin: auto; height: 500px; width: 500px; padding: 200px"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000"\n    overflow="visible" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">\n      <defs>\n        <filter id=\'red-shadow\' color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="100" flood-color="#ff0000" flood-opacity="0.5"/></filter>\n        <filter id=\'green-shadow\' color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="100" flood-color="#00ff00" flood-opacity="0.5"/></filter>\n        <filter id=\'blue-shadow\' color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="100" flood-color="#0000ff" flood-opacity="0.5"/></filter>\n        <filter id=\'drop-shadow\' color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="0" stdDeviation="40" flood-opacity="0.5"/></filter>\n      </defs>\n    \n      </svg></div></div>""")';
    },
    useData: true,
  }),
  test1: Handlebars.template({
    "1": function (container, depth0, helpers, partials, data) {
      var helper,
        alias1 = depth0 != null ? depth0 : container.nullContext || {},
        alias2 = container.hooks.helperMissing,
        alias3 = "function",
        alias4 = container.escapeExpression,
        lookupProperty =
          container.lookupProperty ||
          function (parent, propertyName) {
            if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
              return parent[propertyName];
            }
            return undefined;
          };

      return (
        "<li>" +
        alias4(
          ((helper =
            (helper =
              lookupProperty(helpers, "name") ||
              (depth0 != null ? lookupProperty(depth0, "name") : depth0)) !=
            null
              ? helper
              : alias2),
          typeof helper === alias3
            ? helper.call(alias1, {
                name: "name",
                hash: {},
                data: data,
                loc: {
                  start: { line: 1, column: 104 },
                  end: { line: 1, column: 112 },
                },
              })
            : helper),
        ) +
        " is " +
        alias4(
          ((helper =
            (helper =
              lookupProperty(helpers, "age") ||
              (depth0 != null ? lookupProperty(depth0, "age") : depth0)) != null
              ? helper
              : alias2),
          typeof helper === alias3
            ? helper.call(alias1, {
                name: "age",
                hash: {},
                data: data,
                loc: {
                  start: { line: 1, column: 116 },
                  end: { line: 1, column: 123 },
                },
              })
            : helper),
        ) +
        "</li>"
      );
    },
    compiler: [8, ">= 4.3.0"],
    main: function (container, depth0, helpers, partials, data) {
      var stack1,
        helper,
        options,
        alias1 = depth0 != null ? depth0 : container.nullContext || {},
        alias2 = container.hooks.helperMissing,
        alias3 = "function",
        alias4 = container.escapeExpression,
        lookupProperty =
          container.lookupProperty ||
          function (parent, propertyName) {
            if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
              return parent[propertyName];
            }
            return undefined;
          },
        buffer =
          "<p>Hello, my name is " +
          alias4(
            ((helper =
              (helper =
                lookupProperty(helpers, "name") ||
                (depth0 != null ? lookupProperty(depth0, "name") : depth0)) !=
              null
                ? helper
                : alias2),
            typeof helper === alias3
              ? helper.call(alias1, {
                  name: "name",
                  hash: {},
                  data: data,
                  loc: {
                    start: { line: 1, column: 21 },
                    end: { line: 1, column: 29 },
                  },
                })
              : helper),
          ) +
          ". I am from " +
          alias4(
            ((helper =
              (helper =
                lookupProperty(helpers, "hometown") ||
                (depth0 != null
                  ? lookupProperty(depth0, "hometown")
                  : depth0)) != null
                ? helper
                : alias2),
            typeof helper === alias3
              ? helper.call(alias1, {
                  name: "hometown",
                  hash: {},
                  data: data,
                  loc: {
                    start: { line: 1, column: 41 },
                    end: { line: 1, column: 53 },
                  },
                })
              : helper),
          ) +
          ". I have " +
          alias4(
            container.lambda(
              (stack1 =
                depth0 != null ? lookupProperty(depth0, "kids") : depth0) !=
                null
                ? lookupProperty(stack1, "length")
                : stack1,
              depth0,
            ),
          ) +
          " kids:</p><ul>";
      stack1 =
        ((helper =
          (helper =
            lookupProperty(helpers, "kids") ||
            (depth0 != null ? lookupProperty(depth0, "kids") : depth0)) != null
            ? helper
            : alias2),
        (options = {
          name: "kids",
          hash: {},
          fn: container.program(1, data, 0),
          inverse: container.noop,
          data: data,
          loc: {
            start: { line: 1, column: 91 },
            end: { line: 1, column: 137 },
          },
        }),
        typeof helper === alias3 ? helper.call(alias1, options) : helper);
      if (!lookupProperty(helpers, "kids")) {
        stack1 = container.hooks.blockHelperMissing.call(
          depth0,
          stack1,
          options,
        );
      }
      if (stack1 != null) {
        buffer += stack1;
      }
      return buffer + "</ul>";
    },
    useData: true,
  }),
  analysis: Handlebars.template({
    compiler: [8, ">= 4.3.0"],
    main: function (container, depth0, helpers, partials, data) {
      var helper,
        lookupProperty =
          container.lookupProperty ||
          function (parent, propertyName) {
            if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
              return parent[propertyName];
            }
            return undefined;
          };

      return (
        "function Analysis" +
        container.escapeExpression(
          ((helper =
            (helper =
              lookupProperty(helpers, "name") ||
              (depth0 != null ? lookupProperty(depth0, "name") : depth0)) !=
            null
              ? helper
              : container.hooks.helperMissing),
          typeof helper === "function"
            ? helper.call(
                depth0 != null ? depth0 : container.nullContext || {},
                {
                  name: "name",
                  hash: {},
                  data: data,
                  loc: {
                    start: { line: 1, column: 17 },
                    end: { line: 1, column: 25 },
                  },
                },
              )
            : helper),
        ) +
        "\nend\n"
      );
    },
    useData: true,
  }),
};

