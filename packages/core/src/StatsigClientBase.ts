import './$_StatsigGlobal';
import { EventLogger } from './EventLogger';
import { Log, LogLevel } from './Log';
import { NetworkCore } from './NetworkCore';
import {
  StatsigClientEvent,
  StatsigClientEventCallback,
  StatsigClientEventData,
  StatsigClientEventEmitterInterface,
  StatsigLoadingStatus,
} from './StatsigClientEventEmitter';
import { StatsigOptionsCommon } from './StatsigTypes';

export class StatsigClientBase implements StatsigClientEventEmitterInterface {
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';

  protected _logger: EventLogger;

  protected _sdkKey: string;
  private _listeners: Record<string, StatsigClientEventCallback[]> = {};

  constructor(
    sdkKey: string,
    network: NetworkCore,
    options: StatsigOptionsCommon | null,
  ) {
    this._logger = new EventLogger(sdkKey, network, options);
    this._sdkKey = sdkKey;

    __STATSIG__ = __STATSIG__ ?? {};
    const instances = __STATSIG__.instances ?? new Set();
    instances.add(this);
    __STATSIG__.instances = instances;

    Log.level = options?.logLevel ?? LogLevel.Error;
  }

  on(event: StatsigClientEvent, listener: StatsigClientEventCallback): void {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  off(event: StatsigClientEvent, listener: StatsigClientEventCallback): void {
    if (this._listeners[event]) {
      const index = this._listeners[event].indexOf(listener);
      if (index !== -1) {
        this._listeners[event].splice(index, 1);
      }
    }
  }

  emit(data: StatsigClientEventData): void {
    if (this._listeners[data.event]) {
      this._listeners[data.event].forEach((listener) => listener(data));
    }
  }

  protected setStatus(newStatus: StatsigLoadingStatus): void {
    this.loadingStatus = newStatus;
    this.emit({ event: 'status_change', loadingStatus: newStatus });
  }
}
