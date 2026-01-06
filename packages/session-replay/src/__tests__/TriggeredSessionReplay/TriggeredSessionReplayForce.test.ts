import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay Force', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    StatsigMetadataProvider.add({ isRecordingSession: undefined });
  });

  it('does not start recording when recording blocked', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      recording_blocked: true,
      passes_session_recording_targeting: true,
    });
    const replay = new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    replay.forceStartRecording();
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does start recording when recording when forced', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      recording_blocked: false,
      passes_session_recording_targeting: true,
    });
    const replay = new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    replay.forceStartRecording();
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });
});
