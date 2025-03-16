const js = require("@eslint/js");
const prettier = require("eslint-plugin-prettier");

module.exports = [
  js.configs.recommended, // Use recommended JavaScript rules
  {
    files: ["**/*.js", "**/*.cjs"],
    ignores: ["node_modules/", "dist/", "build/", "logs/", ".env"], // Replaces .eslintignore
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs", // ✅ Explicitly set to CommonJS
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        process: "readonly", // ✅ Fix 'process' is not defined
        describe: "readonly", // ✅ For testing (Mocha/Jest)
        it: "readonly",
        afterEach: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      prettier,
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": ["warn"],
      "no-console": "off",
      "prettier/prettier": "error",
      "no-case-declarations": "off", // ✅ Fix "Unexpected lexical declaration in case block"
    },
  },
];
