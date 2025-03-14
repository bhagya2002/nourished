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

    // Enable auto-fixing for unused imports (as a warning)
    'unused-imports/no-unused-imports': 'warn',

    // Auto-remove unused variables (as a warning)
    'unused-imports/no-unused-vars': [
      'warn', // Changed from 'error' to 'warn'
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
    '@typescript-eslint/no-explicit-any': 'warn', // Changed from 'off' to 'warn'

    // Prefer 'const' but don't force it
    'prefer-const': 'warn',
  },
};
