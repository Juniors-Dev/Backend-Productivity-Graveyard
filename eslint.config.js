const prettierPlugin = require("eslint-plugin-prettier");
const securityPlugin = require("eslint-plugin-security");

module.exports = [
  {
    files: ["**/*.js", "*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
    },
    plugins: {
      prettier: prettierPlugin,
      security: securityPlugin,
    },
    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      semi: ["warn", "always"],
      "no-unused-vars": ["off", { argsIgnorePattern: "^_" }],
      "no-use-before-define": "warn",
      "no-console": "warn",
      "no-empty": ["warn", { allowEmptyCatch: false }],
      "consistent-return": "warn",
      "no-shadow": "warn",
      "prefer-const": "warn",
      "max-depth": ["warn", 4],
      complexity: ["warn", 10],
      "max-len": ["warn", { code: 120 }],
      "keyword-spacing": ["error", { before: true, after: true }],
      "security/detect-object-injection": "warn",
    },
  },
];
