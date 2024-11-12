export const Endpoint = {
  _initialize: 'initialize',
  _rgstr: 'rgstr',
  _download_config_specs: 'download_config_specs',
} as const;

export type Endpoint = (typeof Endpoint)[keyof typeof Endpoint];

export const NetworkDefault = {
  [Endpoint._rgstr]: 'https://prodregistryv2.org/v1' as const,
  [Endpoint._initialize]: 'https://featureassets.org/v1' as const,
  [Endpoint._download_config_specs]: 'https://api.statsigcdn.com/v1' as const,
};

export type NetworkPriority = 'high' | 'low' | 'auto';

export type NetworkArgs = RequestInit & {
  priority?: NetworkPriority;
};

export const NetworkParam = {
  EventCount: 'ec',
  SdkKey: 'k',
  SdkType: 'st',
  SdkVersion: 'sv',
  Time: 't',
  SessionID: 'sid',
  StatsigEncoded: 'se',
  IsGzipped: 'gz',
} as const;

export type NetworkParam = (typeof NetworkParam)[keyof typeof NetworkParam];
