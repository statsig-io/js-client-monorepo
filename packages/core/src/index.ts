import { EventLogger } from './EventLogger';

export * from './StatsigGlobal';
export * from './ClientInterfaces';
export * from './ErrorBoundary';
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

export { EventLogger };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  EventLogger,
};
