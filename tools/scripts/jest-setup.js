require('reflect-metadata'); // Fix for Reflect.metadata test error https://github.com/nrwl/nx/issues/8905
const { Log } = require('@statsig/client-core');

// Mock all fetch calls
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

// Disable logging for all tests (Can be overridden in specific tests)
Log.level = 0;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: require('perf_hooks').performance,
  });
}
