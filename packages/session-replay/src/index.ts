import { _getStatsigGlobal } from '@statsig/client-core';

import {
  SessionReplay,
  StatsigSessionReplayPlugin,
  runStatsigSessionReplay,
} from './SessionReplay';
import {
  forceStartRecording,
  startRecording,
  stopRecording,
} from './SessionReplayBase';
import { SessionReplayClient } from './SessionReplayClient';
import {
  StatsigTriggeredSessionReplayPlugin,
  runStatsigTriggeredSessionReplay,
} from './TriggeredSessionReplay';

export type {
  ReplaySessionData as ReplayData,
  ReplayEvent,
} from './SessionReplayClient';

export {
  SessionReplayClient,
  SessionReplay,
  runStatsigSessionReplay,
  runStatsigTriggeredSessionReplay,
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
  runStatsigTriggeredSessionReplay,
  StatsigSessionReplayPlugin,
  StatsigTriggeredSessionReplayPlugin,
  startRecording,
  stopRecording,
  forceStartRecording,
});
