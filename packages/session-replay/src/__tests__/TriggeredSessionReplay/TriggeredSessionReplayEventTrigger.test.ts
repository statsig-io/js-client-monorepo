import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay Event Trigger', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let emitListener: StatsigClientEventCallback<StatsigClientEventName>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.$on.mockImplementation((name, listener) => {
      if (name === 'log_event_called') {
        emitListener = listener;
      }
      if (name === 'logs_flushed') {
        listener({ name: 'logs_flushed', events: [] });
      }
    });
    StatsigMetadataProvider.add({ isRecordingSession: undefined });
    client.logEvent.mockImplementation((eventName, value, metadata) => {
      const event = {
        eventName: eventName,
        value,
        metadata,
      };
      emitListener({ name: 'log_event_called', event });
    });
  });

  it('does not start recording when event wrong event is logged', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_event_triggers: {
        test_event: {},
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.logEvent('abc');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('starts recording when event is logged and passes targeting', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_event_triggers: {
        test_event: {},
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.logEvent('test_event');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('does not start recording when event is logged and fails targeting', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: false,
      session_recording_event_triggers: {
        test_event: {},
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.logEvent('test_event');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does not start recording when event is logged but does not pass sampling', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_event_triggers: {
        test_event: { passes_sampling: false },
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.logEvent('test_event');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does not start recording when event is logged but value does not match', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_event_triggers: {
        test_event: { values: ['test'] },
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.logEvent('test_event');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does start recording when event is logged and value does match', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_event_triggers: {
        test_event: { values: ['test', '123'] },
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.logEvent('test_event', '123');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('does not start recording if recording previously stopped', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: true,
      passes_session_recording_targeting: true,
      session_recording_event_triggers: {
        test_event: { values: ['test', '123'] },
      },
    });
    const replay = new TriggeredSessionReplay(client, {
      autoStartRecording: true,
    });
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
    replay.stopRecording();
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('false');
    client.logEvent('test_event', '123');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('false');
  });
});
