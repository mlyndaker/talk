/*
  Variables defined in `variables.ts` are already available
  flattened and in kebab case.

  These are additionally variables we define.
*/

import flat from "flat";
import fs from "fs";
import { kebabCase, mapKeys, mapValues } from "lodash";
import path from "path";
import postcssJs from "postcss-js";

import breakpoints from "./breakpoints";
import streamVariables from "./streamVariables";

// postcss >= 8.4 typings can't be loaded by TypeScript 3.9.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const postcss: { parse(css: string): unknown } = require("postcss");

const flatKebabVariables = mapKeys(
  mapValues(flat(streamVariables, { delimiter: "-" }), (v) => v.toString()),
  (_, k) => `--${kebabCase(k)}`
);

const typography = fs
  .readFileSync(path.join(__dirname, "./typography.css"))
  .toString();
const typographyObject = postcssJs.objectify(postcss.parse(typography));

const cssObject = {
  ...typographyObject,
  ":root": {
    ...flatKebabVariables,
    "--mini-unit": "calc(1px * var(--mini-unit-small))",
  },
  [`@media (min-width: ${breakpoints.xs}px)`]: {
    ":root": {
      "--mini-unit": "calc(1px * var(--mini-unit-large))",
    },
  },
};

module.exports = cssObject;
