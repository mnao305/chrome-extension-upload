module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(chrome-webstore-upload|got)/)'
  ],
  verbose: true
}