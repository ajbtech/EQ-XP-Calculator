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
    // Complexity guardrails for the engine + UI: keep cyclomatic complexity and
    // nesting from creeping back up. Thresholds sit just above the current
    // maxima (complexity 8 in renderInline, depth 3) so today's code passes but
    // regressions fail CI.
    rules: {
      complexity: ["error", 10],
      "max-depth": ["error", 4],
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
