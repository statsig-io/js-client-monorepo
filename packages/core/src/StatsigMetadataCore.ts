export const SDK_VERSION = '0.0.2';

export type StatsigMetadata = {
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

const metadata: StatsigMetadata = {
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

export { metadata as StatsigMetadataCore };
