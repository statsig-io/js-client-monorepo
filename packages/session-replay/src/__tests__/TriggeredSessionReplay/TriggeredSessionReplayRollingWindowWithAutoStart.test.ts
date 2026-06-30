import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay With Rolling Window And Auto Start', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    StatsigMetadataProvider.add({ isRecordingSession: undefined });
  });

  it('keeps rolling window when auto start cannot record', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
    });
    const sessionReplay = new TriggeredSessionReplay(client, {
      autoStartRecording: true,
      keepRollingWindow: true,
    });

    const metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    expect(sessionReplay.isRecording()).toBe(true);
  });

  it('auto starts recording when sampled while keeping rolling window enabled', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: true,
      passes_session_recording_targeting: true,
    });
    const sessionReplay = new TriggeredSessionReplay(client, {
      autoStartRecording: true,
      keepRollingWindow: true,
    });

    const metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
    expect(sessionReplay.isRecording()).toBe(true);
  });
});
