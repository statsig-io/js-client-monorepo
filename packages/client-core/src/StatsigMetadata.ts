export const SDK_VERSION = '3.15.2';

export type StatsigMetadata = {
  readonly [key: string]: string | undefined;
  readonly appVersion?: string;
  readonly deviceModel?: string;
  readonly deviceModelName?: string;
  readonly locale?: string;
  readonly sdkVersion: string;
  readonly stableID?: string;
  readonly systemName?: string;
  readonly systemVersion?: string;
};

let metadata: StatsigMetadata = {
  sdkVersion: SDK_VERSION,
  sdkType: 'js-mono', // js-mono is overwritten by Precomp and OnDevice clients
};

export const StatsigMetadataProvider = {
  get: (): StatsigMetadata => metadata,
  add: (additions: { [key: string]: string | undefined }): void => {
    metadata = { ...metadata, ...additions };
  },
};
