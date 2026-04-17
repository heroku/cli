// ESLint 9 flat config using shared Heroku CLI rules
import herokuConfig from '@heroku-cli/test-utils/eslint-config'

export default [
  ...herokuConfig,
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
      'unicorn/no-array-for-each': 'warn',
      'unicorn/no-array-reduce': 'warn',
      'unicorn/no-empty-file': 'warn',
      'unicorn/prefer-event-target': 'warn',
      'unicorn/prefer-spread': 'warn',
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
    ignores: ['**/test/**/*.js', '**/*.d.ts', '.github/**'],
  },
]
