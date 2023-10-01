/** Statsig Global should go first */
import './$_StatsigGlobal';
import { EventLogger } from './EventLogger';

export * from './ClientInterfaces';
export * from './ErrorBoundary';
export * from './Hashing';
export * from './LocalStorageUtil';
export * from './Log';
export * from './Monitoring';
export * from './NetworkCore';
export * from './StableID';
export * from './StatsigEvent';
export * from './$_StatsigGlobal';
export * from './StatsigMetadata';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './UUID';

export { EventLogger };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  EventLogger,
};
