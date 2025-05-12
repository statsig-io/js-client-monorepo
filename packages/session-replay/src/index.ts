import { _getStatsigGlobal } from '@statsig/client-core';

import {
  SessionReplay,
  StatsigSessionReplayPlugin,
  runStatsigSessionReplay,
} from './SessionReplay';
import { SessionReplayClient } from './SessionReplayClient';
import {
  StatsigTriggeredSessionReplayPlugin,
  forceStartRecording,
  startRecording,
  stopRecording,
} from './TriggeredSessionReplay';

export type {
  ReplaySessionData as ReplayData,
  ReplayEvent,
} from './SessionReplayClient';

export {
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
  StatsigSessionReplayPlugin,
  StatsigTriggeredSessionReplayPlugin,
  startRecording,
  stopRecording,
  forceStartRecording,
};

Object.assign(_getStatsigGlobal(), {
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
  StatsigSessionReplayPlugin,
});
