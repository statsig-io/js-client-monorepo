/** @type {import("prettier").Config} */
const config = {
  semi: true,
  trailingComma: "all",
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  importOrder: ["^@statsig/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: [
    "classProperties",
    "decorators-legacy",
    "typescript",
    "jsx",
  ],
  plugins: ["@trivago/prettier-plugin-sort-imports"],
};

module.exports = config;
