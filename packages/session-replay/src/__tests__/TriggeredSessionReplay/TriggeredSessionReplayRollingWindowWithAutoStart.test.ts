import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay With Rolling Window And Auto Start', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let valuesUpdatedListener: StatsigClientEventCallback<StatsigClientEventName>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.$on.mockImplementation((name, listener) => {
      if (name === 'values_updated') {
        valuesUpdatedListener = listener;
      }
      if (name === 'logs_flushed') {
        listener({ name: 'logs_flushed', events: [] });
      }
    });
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

  it('auto starts recording after values_updated enables sampling', () => {
    const { handle } = mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
    });
    new TriggeredSessionReplay(client, {
      autoStartRecording: true,
      keepRollingWindow: true,
    });

    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);

    handle.values = {
      session_recording_rate: 1,
      can_record_session: true,
      passes_session_recording_targeting: true,
    };
    valuesUpdatedListener({ name: 'values_updated' } as any);

    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('stops active recording when recording becomes blocked', () => {
    const { handle } = mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: true,
      passes_session_recording_targeting: true,
    });
    const sessionReplay = new TriggeredSessionReplay(client, {
      autoStartRecording: true,
      keepRollingWindow: true,
    });

    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');

    handle.values = {
      session_recording_rate: 1,
      can_record_session: true,
      passes_session_recording_targeting: true,
      recording_blocked: true,
    };
    valuesUpdatedListener({ name: 'values_updated' } as any);

    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('false');
    expect(sessionReplay.isRecording()).toBe(false);
  });
});
