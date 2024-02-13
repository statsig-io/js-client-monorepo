export type StatsigLoadingStatus =
  | 'Uninitialized'
  | 'Loading'
  | 'Ready'
  | 'Error';

export type StatsigClientEvent = 'status_change' | 'error';
export type StatsigClientEventData =
  | {
      event: StatsigClientEvent;
    }
  | {
      event: 'status_change';
      loadingStatus: StatsigLoadingStatus;
    }
  | {
      event: 'error';
      error: unknown;
    };

export type StatsigClientEventCallback = (data: StatsigClientEventData) => void;

export interface StatsigClientEventEmitterInterface {
  readonly loadingStatus: StatsigLoadingStatus;

  on(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
  off(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
}
