require('../../tools/scripts/jest-setup');

jest.mock('react-native-device-info', () => ({
  default: {
    getVersion: () => '1.2.3',
    getSystemVersion: () => '4.20.0',
    getSystemName: () => 'Android',
    getModel: () => 'Pixel 2',
    getDeviceId: () => 'goldfish',
  },
}));

jest.mock('react-native', () => ({
  NativeModules: {},
  Platform: {},
  AppState: { addEventListener: jest.fn() },
}));
