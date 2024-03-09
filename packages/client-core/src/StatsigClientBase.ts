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
import {
  StatsigDataAdapter,
  StatsigDataAdapterResult,
} from './StatsigDataAdapter';
import { StatsigEventInternal } from './StatsigEvent';
import { StatsigOptionsCommon } from './StatsigOptionsCommon';
import { StatsigUser } from './StatsigUser';

export type EvaluationOptions = {
  disableExposureLog?: boolean;
};

export const DEFAULT_EVAL_OPTIONS: EvaluationOptions = {
  disableExposureLog: false,
};

export type StatsigClientEmitEventFunc = (data: StatsigClientEventData) => void;

export abstract class StatsigClientBase
  implements StatsigClientEventEmitterInterface
{
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';

  protected readonly _errorBoundary: ErrorBoundary;
  protected readonly _logger: EventLogger;

  private _listeners: Record<string, StatsigClientEventCallback[]> = {};

  constructor(
    protected readonly _sdkKey: string,
    protected readonly _adapter: StatsigDataAdapter,

    network: NetworkCore,
    options: StatsigOptionsCommon | null,
  ) {
    Log.level = options?.logLevel ?? LogLevel.Warn;

    this._logger = new EventLogger(
      _sdkKey,
      this.emit.bind(this),
      network,
      options,
    );
    this._errorBoundary = new ErrorBoundary(_sdkKey);

    if (options?.overrideStableID) {
      StableID.setOverride(options.overrideStableID, _sdkKey);
    }

    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.instances ?? new Set();
    instances.add(this);
    __STATSIG__.instances = instances;

    this._adapter.attach(_sdkKey, options);
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

  getDataAdapter(): StatsigDataAdapter {
    return this._adapter;
  }

  protected emit(data: StatsigClientEventData): void {
    if (this._listeners[data.event]) {
      this._listeners[data.event].forEach((listener) => listener(data));
    }

    this._listeners['*']?.forEach((listener) => listener(data));
  }

  protected _setStatus(
    newStatus: StatsigLoadingStatus,
    values: StatsigDataAdapterResult | null,
  ): void {
    this.loadingStatus = newStatus;
    this.emit({ event: 'values_updated', status: newStatus, values });
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

  protected _runPostUpdate(
    current: StatsigDataAdapterResult | null,
    user?: StatsigUser,
  ): void {
    this._adapter.getDataAsync(current, user).catch((err) => {
      Log.error('An error occurred after update.', err);
    });
  }
}
