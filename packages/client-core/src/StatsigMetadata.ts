export const SDK_VERSION = '3.27.0';

export type StatsigMetadata = {
  readonly [key: string]: string | undefined | null;
  readonly appVersion?: string;
  readonly deviceModel?: string;
  readonly deviceModelName?: string;
  readonly locale?: string;
  readonly sdkVersion: string;
  readonly stableID?: string | null;
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
