import { StatsigMetadataProvider } from '@statsig/client-core';

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
}));

describe('StatsigMetadataProvider', () => {
  let metadata: Record<string, unknown>;

  beforeAll(async () => {
    await import('../StatsigMetadataAdditions');

    metadata = StatsigMetadataProvider.get();
  });

  it('gets the expected metadata', () => {
    expect(metadata).toMatchObject({
      appVersion: '1.2.3',
      systemVersion: '4.20.0',
      systemName: 'Android',
      deviceModelName: 'Pixel 2',
      deviceModel: 'goldfish',
    });
  });
});
