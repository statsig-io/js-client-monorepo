require('reflect-metadata'); // Fix for Reflect.metadata test error https://github.com/nrwl/nx/issues/8905

// Mock all fetch calls
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

// jest.mock('react-native-device-info', () => ({
//   default: {
//     getVersion: () => '1.2.3',
//     getSystemVersion: () => '4.20.0',
//     getSystemName: () => 'Android',
//     getModel: () => 'Pixel 2',
//     getDeviceId: () => 'goldfish',
//   },
// }));

// jest.mock('react-native', () => ({
//   NativeModules: {},
//   Platform: {},
//   AppState: { addEventListener: jest.fn() },
// }));

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: require('perf_hooks').performance,
  });
}
