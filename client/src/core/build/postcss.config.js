// The build scripts may already run under ts-node; registering it twice would
// type check the already transpiled output.
if (!process[Symbol.for("ts-node.register.instance")]) {
  require("ts-node/register");
}

const kebabCase = require("lodash/kebabCase");
const mapKeys = require("lodash/mapKeys");
const mapValues = require("lodash/mapValues");
const flat = require("flat");
const paths = require("./paths").default;
const autoprefixer = require("autoprefixer");
const postcssFlexbugsFixes = require("postcss-flexbugs-fixes");
const postcssPresetEnv = require("postcss-preset-env");
const postcssNested = require("postcss-nested");
const postcssImport = require("postcss-import");
const postcssMixins = require("postcss-mixins");
const postcssAdvancedVariables = require("postcss-advanced-variables");

delete require.cache[paths.appSassLikeVariables];
const sassLikeVariables = require(paths.appSassLikeVariables).default;

const kebabs = mapKeys(
  mapValues(flat(sassLikeVariables, { delimiter: "-" }), (v) => v.toString()),
  (_, k) => kebabCase(k)
);

// Prepends `@import` rules for the given files to every CSS stylesheet.
// postcss-import parses imported files with the importer's parser, so the
// `.css.ts` (postcss-js) stylesheets must not import plain CSS files.
const prependImports = (files) => ({
  postcssPlugin: "prepend-imports",
  Once(root, { AtRule, result }) {
    const { from } = result.opts;
    if (from && from.endsWith(".css.ts")) {
      return;
    }
    files
      .slice()
      .reverse()
      .forEach((file) =>
        root.prepend(new AtRule({ name: "import", params: `"${file}"` }))
      );
  },
});

// Generate sass-style variables to inject into css
const postCssVariables = mapValues(kebabs, (value, key) => {
  // Add unit to breakpoints.
  // Add 1 to support mobile first approach where we start
  // with the smallest screen and gradually add styling for the
  // next bigger screen. This is realized using `min-width` without
  // ever using `max-width`.
  if (key.toString().startsWith("breakpoints-")) {
    return `${Number.parseInt(value, 10) + 1}px`;
  }

  // Default return the raw value
  return value;
});

module.exports = {
  plugins: [
    // This allows us to define dynamic css variables.
    prependImports([paths.appThemeMixinsCSS]),
    // Needed by above plugin.
    postcssImport(),
    // Support mixins.
    postcssMixins(),
    // Support nesting.
    postcssNested(),
    // Sass style variables to be used in media queries.
    postcssAdvancedVariables({ variables: postCssVariables }),
    // Provides a modern CSS environment.
    postcssPresetEnv(),
    // Fix known flexbox bugs.
    postcssFlexbugsFixes,
    // Vendor prefixing.
    autoprefixer({
      flexbox: "no-2009",
    }),
  ],
};
