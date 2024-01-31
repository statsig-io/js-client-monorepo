export type StatsigLoadingStatus =
  | 'Uninitialized'
  | 'Loading'
  | 'Cache'
  | 'Provided'
  | 'Network'
  | 'Error';

export type StatsigClientEvent = 'status_change';
export type StatsigClientEventData = {
  event: StatsigClientEvent;
} & {
  event: 'status_change';
  loadingStatus: StatsigLoadingStatus;
};

export type StatsigClientEventCallback = (data: StatsigClientEventData) => void;

export interface StatsigClientEventEmitterInterface {
  readonly loadingStatus: StatsigLoadingStatus;

  on(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
  off(event: StatsigClientEvent, listener: StatsigClientEventCallback): void;
}
