import { _getStatsigGlobal } from '@statsig/client-core';

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

Object.assign(_getStatsigGlobal() ?? {}, {
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
  StatsigSessionReplayPlugin,
});
