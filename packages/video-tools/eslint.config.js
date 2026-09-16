import js from "@eslint/js";
import globals from "globals";

export default [
  { files: ["**/*.mjs", "*.js"], ...js.configs.recommended, languageOptions: { globals: globals.node } },
  { files: ["browser-clock.mjs", "render.mjs"], languageOptions: { globals: globals.browser } },
];
