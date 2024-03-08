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
} from './StatsigDataProvider';
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

  protected _errorBoundary: ErrorBoundary;
  protected _logger: EventLogger;
  protected _sdkKey: string;
  protected _adapter: StatsigDataAdapter;

  private _listeners: Record<string, StatsigClientEventCallback[]> = {};

  constructor(
    sdkKey: string,
    network: NetworkCore,
    options: StatsigOptionsCommon | null,
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

    Log.level = options?.logLevel ?? LogLevel.Warn;
    this._adapter = options?.dataAdapter ?? this._getDefaultDataAdapter();
  }

  getDataAdapter(): StatsigDataAdapter {
    return this._adapter;
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

  protected _enqueueExposure(
    options: EvaluationOptions,
    exposure: StatsigEventInternal,
  ): void {
    if (options.disableExposureLog === true) {
      return;
    }

    this._logger.enqueue(exposure);
  }

  protected abstract _getDefaultDataAdapter(): StatsigDataAdapter;

  protected _runPostUpdate(
    current: StatsigDataAdapterResult | null,
    user?: StatsigUser,
  ): void {
    this._adapter
      .handlePostUpdate?.(this._sdkKey, current, user)
      .catch((err) => {
        Log.error('An error occurred after update.', err);
      });
  }
}
