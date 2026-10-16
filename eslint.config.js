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
  // Centralize SDK/client construction: every `new HerokuSDK` / `new HerokuApiClient`
  // must go through `createSDK` / `createApiClient` in src/lib/sdk.ts, so the CLI-resolved
  // token and platform baseUrl are threaded in one place. (heroku-fetch 0.2.0 drops the
  // implicit ~/.netrc fallback, so a bare `new HerokuSDK()` would 401 keychain/netrc users.)
  {
    files: ['src/**/*.ts'],
    ignores: ['src/lib/sdk.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='HerokuSDK']",
          message: 'Do not construct HerokuSDK directly. Use createSDK(this.heroku, …) from src/lib/sdk.ts.',
        },
        {
          selector: "NewExpression[callee.name='HerokuApiClient']",
          message: 'Do not construct HerokuApiClient directly. Use createApiClient(this.heroku, …) from src/lib/sdk.ts.',
        },
      ],
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
