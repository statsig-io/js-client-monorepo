module.exports = {
  roots: ['../'],
  testMatch: [
    '**/__tests__/**/*.test.{js,ts,jsx,tsx}',
    '**/?(*.)+test.{js,ts,jsx,tsx}',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  preset: 'ts-jest',
};
