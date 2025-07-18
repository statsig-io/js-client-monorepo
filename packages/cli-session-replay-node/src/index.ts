import { _getStatsigGlobal } from '@statsig/client-core';

import { AsciicastEventCode } from './AsciicastTypes';
import { CliRecording } from './CliRecording';
import {
  CliRecordingNodeAdapter,
  CliRecordingNodeAdapterFactory,
} from './CliRecordingNodeAdapter';
import { StatsigCliSessionReplayPlugin } from './CliSessionReplayPlugin';

export * from './AsciicastTypes';
export * from './CliRecordingNodeAdapter';
export * from './CliSessionReplayPlugin';
export * from './CliRecording';

Object.assign(_getStatsigGlobal(), {
  AsciicastEventCode,
  CliRecording,
  CliRecordingNodeAdapter,
  CliRecordingNodeAdapterFactory,
  StatsigCliSessionReplayPlugin,
});
