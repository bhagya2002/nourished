module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  plugins: ['@typescript-eslint', 'unused-imports'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    // Allow console statements
    'no-console': 'off',

    // Enable auto-fixing for unused imports
    'unused-imports/no-unused-imports': 'error',

    // Auto-remove unused variables
    // Setting this rule to error will allow ESLint to auto-fix and remove unused variables.
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],

    // Disable the conflicting TypeScript unused-vars rule so that only the plugin handles it
    '@typescript-eslint/no-unused-vars': 'off',

    // Allow the use of 'any'
    '@typescript-eslint/no-explicit-any': 'off',

    // You can set prefer-const to warn rather than disable it altogether
    'prefer-const': 'warn',
  },
};
