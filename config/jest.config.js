const { defaults: tsjPreset } = require('ts-jest/presets');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...tsjPreset,
  rootDir: '../',
  preset: 'react-native',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'config/test-tsconfig.json',
        babelConfig: './config/test-babel.config.js',
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,ts,jsx,tsx}',
    '**/?(*.)+test.{js,ts,jsx,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
