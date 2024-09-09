import { StatsigMetadataProvider } from '@statsig/client-core';

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
      appVersion: '1.2.3',
      systemVersion: '4.20.0',
      systemName: 'Android',
      deviceModelName: 'Pixel 2',
      deviceModel: 'goldfish',
    });
  });
});
