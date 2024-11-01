require('reflect-metadata'); // Fix for Reflect.metadata test error https://github.com/nrwl/nx/issues/8905

// Mock all fetch calls
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

jest.mock('@statsig/client-core', () => {
  const actual = jest.requireActual('@statsig/client-core');
  actual.Log.level = 0;
  return actual;
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: require('perf_hooks').performance,
  });
}
