import { StatsigUser } from './StatsigUser';

export type DataSource =
  | 'Uninitialized'
  | 'Loading'
  | 'NoValues'
  | 'Cache'
  | 'Network'
  | 'Bootstrap'
  | 'Prefetch';

export type StatsigDataProvider = {
  readonly getData?: (sdkKey: string, user?: StatsigUser) => string | null;
  readonly getDataAsync?: (
    sdkKey: string,
    user?: StatsigUser,
  ) => Promise<string | null>;

  readonly getDataPostInit?: (
    sdkKey: string,
    user?: StatsigUser,
  ) => Promise<string | null>;

  readonly setDataPostInit?: (
    sdkKey: string,
    data: string,
    user?: StatsigUser,
  ) => Promise<void>;

  readonly source: DataSource;
};
