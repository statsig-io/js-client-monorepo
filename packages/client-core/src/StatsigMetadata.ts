const SDK_VERSION = '0.0.1-beta.1';

export type StatsigMetadata = {
  readonly [key: string]: string;
  readonly appVersion: string;
  readonly deviceModel: string;
  readonly deviceModelName: string;
  readonly locale: string;
  readonly sdkType: string;
  readonly sdkVersion: string;
  readonly stableID: string;
  readonly systemName: string;
  readonly systemVersion: string;
};

let metadata: StatsigMetadata = {
  appVersion: '',
  deviceModel: '',
  deviceModelName: '',
  locale: '',
  sdkType: '',
  sdkVersion: SDK_VERSION,
  stableID: '',
  systemName: '',
  systemVersion: '',
};

export const StatsigMetadataProvider = {
  get: (): StatsigMetadata => metadata,
  add: (additions: { [key: string]: string }): void => {
    metadata = { ...metadata, ...additions };
  },
};
