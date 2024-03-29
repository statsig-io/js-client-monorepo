import { StatsigMetadataProvider } from '@statsig/client-core';

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
    const { GetStatsigMetadataAdditions } = await import(
      '../StatsigMetadataAdditions'
    );
    StatsigMetadataProvider.add(GetStatsigMetadataAdditions());
    metadata = StatsigMetadataProvider.get();
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
