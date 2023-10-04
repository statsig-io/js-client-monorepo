import { EventLogger } from './EventLogger';
import { NetworkCore } from './NetworkCore';
import {
  StatsigClientEvent,
  StatsigClientEventCallback,
  StatsigClientEventData,
  StatsigClientEventEmitterInterface,
  StatsigLoadingStatus,
} from './StatsigClientEventEmitter';

export class StatsigClientBase implements StatsigClientEventEmitterInterface {
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';

  protected _logger: EventLogger;
  private _events: Record<string, StatsigClientEventCallback[]> = {};

  constructor(network: NetworkCore) {
    this._logger = new EventLogger(network);
  }

  on(event: StatsigClientEvent, listener: StatsigClientEventCallback): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
  }

  off(event: StatsigClientEvent, listener: StatsigClientEventCallback): void {
    if (this._events[event]) {
      const index = this._events[event].indexOf(listener);
      if (index !== -1) {
        this._events[event].splice(index, 1);
      }
    }
  }

  protected emit(data: StatsigClientEventData): void {
    if (this._events[data.event]) {
      this._events[data.event].forEach((listener) => listener(data));
    }
  }

  protected setStatus(newStatus: StatsigLoadingStatus): void {
    this.loadingStatus = newStatus;
    this.emit({ event: 'status_change', loadingStatus: newStatus });
  }
}
