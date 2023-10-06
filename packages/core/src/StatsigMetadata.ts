const SDK_VERSION = '0.0.6';

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

function get(): StatsigMetadata {
  return metadata;
}

function add(additions: { [key: string]: string }): void {
  metadata = { ...metadata, ...additions };
}

export const StatsigMetadataProvider = {
  get,
  add,
};
