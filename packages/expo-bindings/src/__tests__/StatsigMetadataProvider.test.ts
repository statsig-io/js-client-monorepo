import { StatsigMetadata } from '@sigstat/core';

jest.mock('expo-application', () => ({
  nativeApplicationVersion: 'a-native-app-version',
}));

jest.mock('expo-device', () => ({
  modelId: 'a-model-id',
  modelName: 'a-model-name',
  osName: 'an-os-name',
  osVersion: 'an-os-version',
}));

jest.mock('react-native', () => ({
  NativeModules: {},
  Platform: {},
}));

describe('StatsigMetadataProvider', () => {
  let metadata: Record<string, unknown>;

  beforeAll(async () => {
    await import('../StatsigMetadataProvider');

    metadata = StatsigMetadata.get();
  });

  it('gets the expected metadata', () => {
    expect(metadata).toMatchObject({
      appVersion: 'a-native-app-version',
      deviceModel: 'a-model-id',
      deviceModelName: 'a-model-name',
      systemName: 'an-os-name',
      systemVersion: 'an-os-version',
    });
  });
});
