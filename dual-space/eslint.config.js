import base from "@math-visualizations/config/eslint";
import js from "@eslint/js";
import globals from "globals";

export default [
  ...base,
  { files: ["scripts/video/*.mjs"], ...js.configs.recommended, languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
