import { StatsigUser } from './StatsigUser';

export type DataSource =
  | 'Uninitialized'
  | 'Loading'
  | 'NoValues'
  | 'Cache'
  | 'Network'
  | 'NetworkNotModified'
  | 'Bootstrap'
  | 'Prefetch';

export type StatsigDataAdapterResult = {
  readonly source: DataSource;
  readonly data: string;
};

export type StatsigDataAdapter = {
  readonly getData: (
    sdkKey: string,
    user?: StatsigUser,
  ) => StatsigDataAdapterResult | null;

  readonly handlePostUpdate: (
    sdkKey: string,
    result: StatsigDataAdapterResult | null,
    user?: StatsigUser,
  ) => Promise<void>;
};

export type StatsigDataProviderLegacy = {
  readonly getData?: (sdkKey: string, user?: StatsigUser) => string | null;

  readonly getDataAsync?: (
    sdkKey: string,
    user?: StatsigUser,
  ) => Promise<string | null>;

  readonly getDataPostInit?: (
    sdkKey: string,
    currentData: string | null,
    user?: StatsigUser,
  ) => Promise<string | null>;

  readonly setDataPostInit?: (
    sdkKey: string,
    data: string,
    user?: StatsigUser,
  ) => Promise<void>;

  readonly source: DataSource;
};
