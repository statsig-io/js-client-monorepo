export * from './Hashing';
export * from './LocalStorageUtil';
export * from './Monitoring';
export * from './StatsigClientInterfaces';
export * from './StatsigEvent';
export * from './StatsigLogger';
export * from './StatsigMetadata';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './StatsigNetworkCore';

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}
