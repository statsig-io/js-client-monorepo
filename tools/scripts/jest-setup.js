require('reflect-metadata'); // Fix for Reflect.metadata test error https://github.com/nrwl/nx/issues/8905

// Mock all fetch calls
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

Object.defineProperty(window, 'performance', {
  value: require('perf_hooks').performance,
});
