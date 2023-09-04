export * from './Hashing';
export * from './Monitoring';
export * from './StatsigLogger';
export * from './StatsigEvent';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './LocalStorageUtil';
export * from './StatsigClientInterfaces';

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}
