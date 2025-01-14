import { StatsigWarnings } from './EvaluationTypes';
import { DataSource } from './StatsigDataAdapter';

export type StatsigUpdateDetails = {
  duration: number;
  source: DataSource;
  success: boolean;
  error: Error | null;
  sourceUrl: string | null;
  warnings?: StatsigWarnings[];
};

export const createUpdateDetails = (
  success: boolean,
  source: DataSource,
  initDuration: number,
  error: Error | null,
  sourceUrl: string | null,
  warnings?: StatsigWarnings[],
): StatsigUpdateDetails => {
  return {
    duration: initDuration,
    source,
    success,
    error,
    sourceUrl,
    warnings,
  };
};

export const UPDATE_DETAIL_ERROR_MESSAGES = {
  NO_NETWORK_DATA:
    'No data was returned from the network. This may be due to a network timeout if a timeout value was specified in the options or ad blocker error.',
};
