import './$_StatsigGlobal';
import { ErrorBoundary } from './ErrorBoundary';
import { EventLogger } from './EventLogger';
import { Log, LogLevel } from './Log';
import { NetworkCore } from './NetworkCore';
import { StableID } from './StableID';
import {
  StatsigClientEvent,
  StatsigClientEventCallback,
  StatsigClientEventData,
  StatsigClientEventEmitterInterface,
  StatsigLoadingStatus,
} from './StatsigClientEventEmitter';
import { DataSource, StatsigDataProvider } from './StatsigDataProvider';
import { StatsigEventInternal } from './StatsigEvent';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { StatsigUser } from './StatsigUser';

type DataProviderResult = { data: string | null; source: DataSource };

export type EvaluationOptions = {
  disableExposureLog?: boolean;
};

export const DEFAULT_EVAL_OPTIONS: EvaluationOptions = {
  disableExposureLog: false,
};

export type StatsigClientEmitEventFunc = (data: StatsigClientEventData) => void;

export class StatsigClientBase implements StatsigClientEventEmitterInterface {
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';

  protected _errorBoundary: ErrorBoundary;
  protected _logger: EventLogger;
  protected _sdkKey: string;
  protected _dataProviders: StatsigDataProvider[];

  private _listeners: Record<string, StatsigClientEventCallback[]> = {};

  constructor(
    sdkKey: string,
    network: NetworkCore,
    options: StatsigOptionsCommon | null,
    dataProviders: StatsigDataProvider[],
  ) {
    this._logger = new EventLogger(
      sdkKey,
      this.emit.bind(this),
      network,
      options,
    );
    this._sdkKey = sdkKey;
    this._errorBoundary = new ErrorBoundary(sdkKey);

    if (options?.overrideStableID) {
      StableID.setOverride(options.overrideStableID, sdkKey);
    }

    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.instances ?? new Set();
    instances.add(this);
    __STATSIG__.instances = instances;

    Log.level = options?.logLevel ?? LogLevel.Error;
    this._dataProviders = dataProviders;
  }

  on(
    event: StatsigClientEvent | '*',
    listener: StatsigClientEventCallback,
  ): void {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  off(
    event: StatsigClientEvent | '*',
    listener: StatsigClientEventCallback,
  ): void {
    if (this._listeners[event]) {
      const index = this._listeners[event].indexOf(listener);
      if (index !== -1) {
        this._listeners[event].splice(index, 1);
      }
    }
  }

  protected emit(data: StatsigClientEventData): void {
    if (this._listeners[data.event]) {
      this._listeners[data.event].forEach((listener) => listener(data));
    }

    this._listeners['*']?.forEach((listener) => listener(data));
  }

  protected _setStatus(newStatus: StatsigLoadingStatus): void {
    this.loadingStatus = newStatus;
    this.emit({ event: 'status_change', loadingStatus: newStatus });
  }

  protected _getDataFromProviders(user?: StatsigUser): DataProviderResult {
    for (const provider of this._dataProviders) {
      const data = provider.getData?.(this._sdkKey, user);
      if (data) {
        return { data, source: provider.source };
      }
    }

    return { data: null, source: 'NoValues' };
  }

  protected async _getDataFromProvidersAsync(
    user?: StatsigUser,
  ): Promise<DataProviderResult> {
    for await (const provider of this._dataProviders) {
      const data = await provider.getDataAsync?.(this._sdkKey, user);
      if (data) {
        return { data, source: provider.source };
      }
    }

    return { data: null, source: 'NoValues' };
  }

  protected async _getDataPostInitFromProviders(
    user?: StatsigUser,
  ): Promise<DataProviderResult> {
    for await (const provider of this._dataProviders) {
      const data = await provider.getDataPostInit?.(this._sdkKey, user);
      if (data) {
        return { data, source: provider.source };
      }
    }

    return { data: null, source: 'NoValues' };
  }

  protected _saveToDataProviders(
    data: string | null,
    user?: StatsigUser,
  ): void {
    (async () => {
      const localResult = await this._getDataPostInitFromProviders(user);
      data = localResult.data ?? data;

      if (!data) {
        return;
      }

      for await (const provider of this._dataProviders) {
        await provider.setDataPostInit?.(this._sdkKey, data, user);
      }
    })().catch((error: unknown) => {
      this.emit({ event: 'error', error });
    });
  }

  protected _enqueueExposure(
    options: EvaluationOptions,
    exposure: StatsigEventInternal,
  ): void {
    if (options.disableExposureLog === true) {
      return;
    }

    this._logger.enqueue(exposure);
  }
}
