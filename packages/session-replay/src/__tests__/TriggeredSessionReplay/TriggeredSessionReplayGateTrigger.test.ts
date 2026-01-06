import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay Gate Trigger', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let emitListener: StatsigClientEventCallback<StatsigClientEventName>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.$on.mockImplementation((name, listener) => {
      if (name === 'gate_evaluation') {
        emitListener = listener;
      }
      if (name === 'logs_flushed') {
        listener({ name: 'logs_flushed', events: [] });
      }
    });
    StatsigMetadataProvider.add({ isRecordingSession: undefined });
    client.checkGate.mockImplementation((name: string) => {
      const gate = {
        name: name,
        value: false,
        ruleID: '',
        details: {
          reason: '',
        },
        idType: 'userID',
        __evaluation: null,
      };
      emitListener({ name: 'gate_evaluation', gate });

      return false;
    });
  });

  it('does not start recording when event wrong event is logged', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_exposure_triggers: {
        3114454104: {},
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.checkGate('abc');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('starts recording when event is logged and passes targeting', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_exposure_triggers: {
        3114454104: {},
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.checkGate('test_gate');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('does not start recording when event is logged and fails targeting', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: false,
      session_recording_exposure_triggers: {
        3114454104: {},
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.checkGate('test_gate');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does not start recording when event is logged but does not pass sampling', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_exposure_triggers: {
        3114454104: { passes_sampling: false },
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.checkGate('test_gate');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does not start recording when event is logged but value does not match', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_exposure_triggers: {
        3114454104: { values: ['true'] },
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.checkGate('test_gate');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does start recording when event is logged and value does match', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: false,
      passes_session_recording_targeting: true,
      session_recording_exposure_triggers: {
        3114454104: { values: ['false'] },
      },
    });
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.checkGate('test_gate');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('does not start recording if recording previously stopped', () => {
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: true,
      passes_session_recording_targeting: true,
      session_recording_exposure_triggers: {
        3114454104: { values: ['false'] },
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
    client.checkGate('test_gate');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('false');
  });
});
