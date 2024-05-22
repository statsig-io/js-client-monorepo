export const NetworkDefault = {
  eventsApi: 'https://prodregistryv2.org/v1' as const,
  initializeApi: 'https://featureassets.org/v1' as const,
  specsApi: 'https://assetsconfigcdn.org/v1' as const,
};

export type NetworkPriority = 'high' | 'low' | 'auto';

export type NetworkArgs = RequestInit & {
  priority?: NetworkPriority;
};

export enum NetworkParam {
  EventCount = 'ec',
  SdkKey = 'k',
  SdkType = 'st',
  SdkVersion = 'sv',
  Time = 't',
  SessionID = 'sid',
  StatsigEncoded = 'se',
  IsGzipped = 'gz',
}
