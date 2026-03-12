module.exports = {
  extends: [
    'oclif',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:perfectionist/recommended-natural-legacy',
    'plugin:mocha/recommended',
  ],
  ignorePatterns: ['**/test/**/*.js', 'dist/**', '**/*.d.ts'],
  // TypeScript settings
  overrides: [
    {
      files: ['**/test/**/*.ts', '**/test/**/*.js', 'test/**/*.ts', 'test/**/*.js'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
        'mocha/prefer-arrow-callback': 'off',
        'prefer-arrow-callback': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',

  // Global settings
  plugins: ['import', 'mocha', '@typescript-eslint'],

  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_', ignoreRestSiblings: true}], // TODO: fix issues and turn this back on
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-var-requires': 'off',
    camelcase: 'off',
    'func-names': 'warn', // TODO: fix issues and turn this back on
    'import/default': 'warn',
    'import/namespace': 'warn',
    'import/no-unresolved': 'error',
    indent: ['error', 2, {MemberExpression: 1}],
    'mocha/max-top-level-suites': ['warn', {limit: 2}],
    'mocha/no-exports': 'warn',
    'mocha/no-mocha-arrows': 'warn',
    'mocha/no-setup-in-describe': 'warn',
    'n/no-deprecated-api': 'warn', // TODO: fix issues and turn this back on
    'n/no-missing-import': 'off',
    'n/no-unsupported-features/es-builtins': 'warn', // TODO: fix issues and turn this back on
    'n/no-unsupported-features/es-syntax': 'off',
    'n/no-unsupported-features/node-builtins': 'warn', // TODO: fix issues and turn this back on
    'no-await-in-loop': 'off', // Perfect legit to use await in loops, we should leave it off
    'no-constant-condition': ['error', {checkLoops: false}],
    'no-else-return': 'warn', // TODO: fix issues and turn this back on
    'no-negated-condition': 'warn', // TODO: fix issues and turn this back on
    'no-process-exit': 'off',
    'no-promise-executor-return': 'warn', // TODO: fix issues and turn this back on
    'no-prototype-builtins': 'warn', // TODO: fix issues and turn this back on
    'no-return-await': 'warn', // TODO: fix issues and turn this back on
    'no-unused-expressions': 'off',
    'no-useless-constructor': 'off',
    'node/no-missing-import': 'off', // using import/no-unresolved instead
    'object-curly-newline': 'warn',
    'perfectionist/sort-classes': [
      'warn',
      {
        groups: [
          'index-signature',
          'static-property',
          'property',
          'private-property',
          'constructor',
          'static-method',
          'static-private-method',
          ['get-method', 'set-method'],
          'method',
          'private-method',
          'unknown',
        ],
        order: 'asc',
        type: 'alphabetical',
      },
    ],
    'perfectionist/sort-imports': 'warn',
    'perfectionist/sort-interfaces': 'warn',
    'perfectionist/sort-intersection-types': 'warn',
    'perfectionist/sort-modules': 'warn',
    'perfectionist/sort-named-imports': 'warn',
    'perfectionist/sort-object-types': 'warn',
    'perfectionist/sort-objects': 'warn',
    'perfectionist/sort-switch-case': 'off',
    'perfectionist/sort-union-types': 'warn',
    'prefer-object-spread': 'warn',
    radix: 'warn', // TODO: fix issues and turn this back on
    'unicorn/better-regex': 'off', // TODO: fix issues and turn this back on
    'unicorn/consistent-function-scoping': 'off', // TODO: fix issues and turn this back on
    'unicorn/filename-case': 'off',
    'unicorn/import-style': 'off',
    'unicorn/no-abusive-eslint-disable': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/no-array-reduce': 'warn', // TODO: fix issues and turn this back on
    'unicorn/no-empty-file': 'warn',
    'unicorn/no-lonely-if': 'off',
    'unicorn/no-process-exit': 'off',
    'unicorn/no-useless-undefined': 'warn', // TODO: fix issues and turn this back on
    'unicorn/numeric-separators-style': 'off',
    'unicorn/prefer-array-some': 'warn', // TODO: fix issues and turn this back on
    'unicorn/prefer-event-target': 'warn',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-object-from-entries': 'warn', // TODO: fix issues and turn this back on
    'unicorn/prefer-regexp-test': 'off',
    'unicorn/prefer-spread': 'off', // TODO: fix issues and turn this back on
    'unicorn/prefer-string-replace-all': 'warn',
    'unicorn/prefer-string-slice': 'warn', // TODO: fix issues and turn this back on
    'unicorn/prefer-ternary': 'off', // TODO: fix issues and turn this back on
    'valid-jsdoc': ['warn', {requireParamType: false, requireReturnType: false}],
    'wrap-iife': 'warn', // TODO: fix issues and turn this back on
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
    },
  },
}
