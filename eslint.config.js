import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  eslintPluginPrettier,
  eslintConfigPrettier,
  // @todo - 과제 완료 후 아래 코드 삭제
  {
    rules: {
      "no-unused-vars": "warn", // error에서 warn으로 변경
    },
  },
];
