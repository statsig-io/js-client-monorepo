import { SessionReplay, runStatsigSessionReplay } from './SessionReplay';
import { SessionReplayClient } from './SessionReplayClient';

export type {
  ReplaySessionData as ReplayData,
  ReplayEvent,
} from './SessionReplayClient';
export { SessionReplayClient, SessionReplay, runStatsigSessionReplay };

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
};
