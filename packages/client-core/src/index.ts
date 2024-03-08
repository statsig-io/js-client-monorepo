/** Statsig Global should go first */
import './$_StatsigGlobal';
import { EventLogger } from './EventLogger';
import { Log } from './Log';

export * from './$_StatsigGlobal';
export * from './ClientInterfaces';
export * from './ErrorBoundary';
export * from './Hashing';
export * from './StorageProvider';
export * from './Log';
export * from './Monitoring';
export * from './NetworkCore';
export * from './StableID';
export * from './StatsigClientBase';
export * from './StatsigClientEventEmitter';
export * from './StatsigDataAdapter';
export * from './StatsigEvent';
export * from './StatsigMetadata';
export * from './StatsigOptionsCommon';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './UUID';
export * from './VisibilityChangeObserver';

export { EventLogger };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  EventLogger,
  Log,
};
