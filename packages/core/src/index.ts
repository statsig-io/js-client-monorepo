export * from './Hashing';
export * from './IDUtils';
export * from './LocalStorageUtil';
export * from './Monitoring';
export * from './StatsigClientInterfaces';
export * from './StatsigEvent';
export * from './StatsigLogger';
export * from './StatsigMetadata';
export * from './StatsigNetworkCore';
export * from './StatsigTypes';
export * from './StatsigUser';

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}
