export * from './ClientInterfaces';
export * from './Hashing';
export * from './UUID';
export * from './LocalStorageUtil';
export * from './Monitoring';
export * from './Logger';
export * from './NetworkCore';
export * from './StatsigEvent';
export * from './StatsigMetadata';
export * from './StatsigTypes';
export * from './StatsigUser';

declare global {
  interface Window {
    __STATSIG__: {
      [key: string]: unknown;
    };
  }
}
