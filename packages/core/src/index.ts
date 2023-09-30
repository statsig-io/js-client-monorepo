export * from './ClientInterfaces';
export * from './EventLogger';
export * from './Hashing';
export * from './LocalStorageUtil';
export * from './Log';
export * from './Monitoring';
export * from './NetworkCore';
export * from './StatsigEvent';
export * from './StatsigMetadata';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './UUID';

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}
