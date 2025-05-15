import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';

describe('Triggered Session Replay Force', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    StatsigMetadataProvider.add({ isRecordingSession: undefined });
  });

  it('does not start recording when recording blocked', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        recording_blocked: true,
        passes_session_recording_targeting: true,
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    const replay = new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    replay.forceStartRecording();
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does start recording when recording when forced', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        recording_blocked: false,
        passes_session_recording_targeting: true,
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    const replay = new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    replay.forceStartRecording();
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });
});
