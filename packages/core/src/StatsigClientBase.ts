type EventCallback = (data: Record<string, unknown>) => void;

export class StatsigClientBase {
  private _events: Record<string, EventCallback[]> = {};

  on(event: string, listener: EventCallback): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
  }

  off(event: string, listener: EventCallback): void {
    if (this._events[event]) {
      const index = this._events[event].indexOf(listener);
      if (index !== -1) {
        this._events[event].splice(index, 1);
      }
    }
  }

  protected emit(event: string, data: Record<string, unknown>): void {
    if (this._events[event]) {
      this._events[event].forEach((listener) => listener(data));
    }
  }
}
