module.exports = {
  setupTestFrameworkScriptFile: '<rootDir>/src/__test__/init.ts',
  mapCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/src/__test__'],
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
  globalSetup: '<rootDir>/src/__test__/setup.js',
  globalTeardown: '<rootDir>/src/__test__/teardown.js',
  transform: {
    '^.+\\.ts$': '<rootDir>/node_modules/ts-jest/preprocessor.js',
  },
  globals: {
    'ts-jest': {
      skipBabel: true,
    },
  },
}
