// ESLint 9 flat config using shared Heroku CLI rules
import herokuConfig from '@heroku-cli/test-utils/eslint-config'

export default [
  ...herokuConfig,
  // Project-specific overrides
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      camelcase: 'warn',
      'no-promise-executor-return': 'warn',
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
