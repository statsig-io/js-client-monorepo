import {
  StatsigClientEvent,
  StatsigClientEventCallback,
  StatsigClientEventData,
  StatsigClientEventEmitterInterface,
  StatsigLoadingStatus,
} from './StatsigClientEventEmitter';

export class StatsigClientBase implements StatsigClientEventEmitterInterface {
  loadingStatus: StatsigLoadingStatus = 'Uninitialized';

  private _events: Record<string, StatsigClientEventCallback[]> = {};

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
}
