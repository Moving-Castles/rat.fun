import prettier from "eslint-config-prettier"
import js from "@eslint/js"
import globals from "globals"
import ts from "typescript-eslint"

export default ts.config(
  { ignores: ["dist/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-useless-catch": "warn",
      // prevent auth bypass via missing await on async functions
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksConditionals: true }
      ]
    }
  }
)
