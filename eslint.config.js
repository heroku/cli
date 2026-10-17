// ESLint 10 flat config using shared Heroku CLI rules
import herokuConfig from '@heroku-cli/test-utils/eslint-config'
import mocha from '@heroku-cli/test-utils/eslint-config/mocha'

const config = [
  ...herokuConfig,
  ...mocha,
  // Project-specific overrides
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'array-callback-return': 'warn',
      camelcase: 'off',
      'n/no-unpublished-bin': 'off', // we're getting false positives with this
      'n/no-unsupported-features/node-builtins': 'warn',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'warn',
      semi: ['warn', 'never'],
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/no-array-callback-reference': 'warn',
      'unicorn/no-array-reduce': 'warn',
      'unicorn/no-empty-file': 'warn',
      'unicorn/prefer-event-target': 'warn',
      'unicorn/prefer-spread': 'warn',
    },
  },
  // Keep the pre-ESLint 10 repo conventions where newer XO defaults would
  // otherwise require a large source-only style/type cleanup.
  {
    rules: {
      // These type-aware rules were not part of the previous recommended config
      // and currently produce mostly existing `any`-typed SDK/test-helper noise.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-template-expression': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-restricted-types': 'off',

      // This was intentionally disabled in the previous XO config.
      'require-unicode-regexp': 'off',

      // Retain these non-type-aware checks at lower severity during adoption.
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',

      // Restore the old XO class-member spacing and keep current type-member
      // delimiters compatible with existing interfaces and object types.
      '@stylistic/lines-between-class-members': [
        'error',
        {
          enforce: [
            {blankLine: 'always', prev: '*', next: 'method'},
            {blankLine: 'always', prev: 'method', next: 'field'},
            {blankLine: 'never', prev: 'field', next: 'field'},
          ],
        },
      ],
      '@stylistic/member-delimiter-style': 'off',
      '@stylistic/type-annotation-spacing': 'off',
      'xo/import-specifier-newline': 'off',
      'mocha/consistent-spacing-between-blocks': 'warn',
      '@eslint-community/eslint-comments/require-description': 'warn',
      'n/prefer-global/buffer': 'warn',
      'no-useless-assignment': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    rules: {
      // Keep type-aware rules scoped to TypeScript so the JS config/scripts do
      // not require project type information.
      '@typescript-eslint/no-shadow': 'warn',
      '@typescript-eslint/promise-function-async': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-confusing-void-expression': 'warn',
      '@typescript-eslint/strict-void-return': 'warn',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'warn',
    },
  },
  // Test file overrides
  {
    files: ['test/**/*.ts', 'test/**/*.js'],
    rules: {
      'mocha/max-top-level-suites': 'warn',
      'mocha/no-exports': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
    },
  },
  // Ignore patterns (in addition to shared ignores)
  {
    ignores: ['**/test/**/*.js', '**/*.d.ts', '.github/**', 'tmp/**/*', 'scripts/codemods/**', 'src/lib/local/foreman/**'],
  },
]

export default config
