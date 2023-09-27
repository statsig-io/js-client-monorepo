const { defaults: tsjPreset } = require('ts-jest/presets');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: '../',
  preset: 'react-native',
  transform: {
    ...tsjPreset.transform,
    '^.+\\.(js|ts|tsx)$': [
      'babel-jest',
      { configFile: './config/test-babel.config.js' },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,ts,jsx,tsx}',
    '**/?(*.)+test.{js,ts,jsx,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
