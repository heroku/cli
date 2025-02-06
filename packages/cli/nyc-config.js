module.exports = {
  cache: false,
  extension: ['.ts'],
  exclude: [
    '**/*.d.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
    'test/**/*',
    'lib/**/*',
    'coverage/**',
    '.nyc_output/**',
  ],
  include: [
    'src/**/*.ts',
  ],
  reporter: [
    'text-summary',
    'html',
    'lcov',
  ],
  all: true,
  'check-coverage': true,
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
  require: [
    'ts-node/register',
    'source-map-support/register',
  ],
  sourceMap: true,
  instrument: true,
}
