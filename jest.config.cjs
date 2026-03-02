/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  moduleFileExtensions: ['js', 'json', 'ts'],

  // preset: 'ts-jest',
  // transform: {
  //   "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest"
  // },
  // transformIgnorePatterns: [
  //   "node_modules/(?!variables/.*)"
  // ],
  // moduleFileExtensions: ['ts','tsx','js','jsx','json','node']
};
