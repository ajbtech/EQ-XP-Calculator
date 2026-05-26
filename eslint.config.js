import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "data/"],
  },
  js.configs.recommended,
  {
    // Browser-facing source: src/ui.js touches the DOM; pure modules don't,
    // but sharing one browser+module config here is harmless.
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  {
    files: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
];
