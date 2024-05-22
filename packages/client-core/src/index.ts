/** Statsig Global should go first */
import './$_StatsigGlobal';
import { StatsigGlobal } from './$_StatsigGlobal';
import { EventLogger } from './EventLogger';
import { Log } from './Log';
import { SDK_VERSION } from './StatsigMetadata';
import { Storage } from './StorageProvider';

export * from './$_StatsigGlobal';
export * from './CacheKey';
export * from './ClientInterfaces';
export * from './DataAdapterCore';
export * from './DownloadConfigSpecsResponse';
export * from './ErrorBoundary';
export * from './EvaluationOptions';
export * from './EvaluationTypes';
export * from './Hashing';
export * from './InitializeResponse';
export * from './Log';
export * from './NetworkCore';
export * from './NetworkConfig';
export * from './OverrideAdapter';
export * from './SafeJs';
export * from './SDKType';
export * from './SessionID';
export * from './StableID';
export * from './StatsigClientBase';
export * from './StatsigClientEventEmitter';
export * from './StatsigDataAdapter';
export * from './StatsigEvent';
export * from './StatsigMetadata';
export * from './StatsigOptionsCommon';
export * from './StatsigTypeFactories';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './StorageProvider';
export * from './TypedJsonParse';
export * from './UrlOverrides';
export * from './UtitlityTypes';
export * from './UUID';
export * from './VisibilityObserving';

export { EventLogger, Storage, Log };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  Log,
  SDK_VERSION,
} as StatsigGlobal;
