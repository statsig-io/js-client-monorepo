import '@testing-library/jest-native/extend-expect';
import fetchMock from 'jest-fetch-mock';
// Fix for Reflect.metadata test error https://github.com/nrwl/nx/issues/8905
import 'reflect-metadata';

fetchMock.enableMocks();

// Mock Async Storage for RN
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock RN Device Info
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

Object.defineProperty(window, 'performance', {
  value: require('perf_hooks').performance,
});

jest.setTimeout(10_000);
