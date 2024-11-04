/** Statsig Global should go first */
import './$_StatsigGlobal';
import { StatsigGlobal } from './$_StatsigGlobal';
import { Diagnostics } from './Diagnostics';
import { EventLogger } from './EventLogger';
import { Log } from './Log';
import { SDK_VERSION } from './StatsigMetadata';
import { Storage } from './StorageProvider';

export * from './$_StatsigGlobal';
export * from './CacheKey';
export * from './ClientInterfaces';
export * from './DataAdapterCore';
export * from './Diagnostics';
export * from './DownloadConfigSpecsResponse';
export * from './ErrorBoundary';
export * from './EvaluationOptions';
export * from './EvaluationTypes';
export * from './Hashing';
export * from './InitializeResponse';
export * from './Log';
export * from './NetworkConfig';
export * from './NetworkCore';
export * from './OverrideAdapter';
export * from './ParamStoreTypes';
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
export * from './StatsigPlugin';
export * from './StatsigTypeFactories';
export * from './StatsigTypes';
export * from './StatsigUser';
export * from './StorageProvider';
export * from './TypedJsonParse';
export * from './TypingUtils';
export * from './UrlConfiguration';
export * from './UUID';
export * from './VisibilityObserving';

export { EventLogger, Storage, Log, Diagnostics };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  Log,
  SDK_VERSION,
} as StatsigGlobal;
