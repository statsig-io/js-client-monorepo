import { StatsigUser } from './StatsigUser';

export type EvaluationSource =
  | 'Uninitialized'
  | 'Loading'
  | 'NoValues'
  | 'Cache'
  | 'Network'
  | 'Bootstrap'
  | 'Prefetch';

export type EvaluationDataProvider = {
  readonly getEvaluationsData?: (
    sdkKey: string,
    user: StatsigUser,
  ) => Promise<string | null>;
  readonly getEvaluationsDataPostInit?: (
    sdkKey: string,
    user: StatsigUser,
  ) => Promise<string | null>;

  readonly setEvaluationsData?: (
    sdkKey: string,
    user: StatsigUser,
    data: string,
  ) => Promise<void>;

  readonly source: EvaluationSource;
  readonly isTerminal: boolean;
};
