const { defaults: tsjPreset } = require('ts-jest/presets');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...tsjPreset,
  rootDir: '../',
  preset: 'react-native',
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'config/test-tsconfig.json',
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,ts,jsx,tsx}',
    '**/?(*.)+test.{js,ts,jsx,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
