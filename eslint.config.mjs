import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["build/**", "node_modules/**"] },

  js.configs.recommended,

  {
    // Extension source: browser globals plus the `chrome` namespace, which is
    // what the old `/* eslint-disable no-undef */` header in every file was
    // working around.
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.webextensions },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      // Without this, components referenced only from JSX read as unused.
      "react/jsx-uses-vars": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["src/**/*.test.js", "config/jest/setupTests.js"],
    languageOptions: {
      sourceType: "module",
      // `chrome` is installed on globalThis by the setup file itself.
      globals: { ...globals.jest, ...globals.node, ...globals.webextensions },
    },
  },

  {
    files: ["webpack/**/*.js", "config/jest/*Mock.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },

  // Must stay last: turns off the stylistic rules Prettier owns.
  prettier,
];
