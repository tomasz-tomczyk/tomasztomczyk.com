import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";

const commonRules = {
  semi: ["error", "always"],
  quotes: ["error", "double", { allowTemplateLiterals: true }],
};

export default [
  {
    ignores: [".astro/**", "dist/**", "node_modules/**", "public/**", ".vscode/**"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...commonRules,
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  ...astroPlugin.configs.recommended,
  {
    files: ["**/*.astro"],
    rules: {
      ...commonRules,
    },
  },
];
