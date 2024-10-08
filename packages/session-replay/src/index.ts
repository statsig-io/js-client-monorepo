import { StatsigGlobal } from '@statsig/client-core';

import {
  SessionReplay,
  StatsigSessionReplayPlugin,
  runStatsigSessionReplay,
} from './SessionReplay';
import { SessionReplayClient } from './SessionReplayClient';

export type {
  ReplaySessionData as ReplayData,
  ReplayEvent,
} from './SessionReplayClient';

export {
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
  StatsigSessionReplayPlugin,
};

__STATSIG__ = {
  ...(__STATSIG__ ?? {}),
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
  StatsigSessionReplayPlugin,
} as StatsigGlobal;
