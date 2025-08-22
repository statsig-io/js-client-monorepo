import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
  TypedReturn,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';

describe('Triggered Session Replay Gate Trigger', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let emitListener: StatsigClientEventCallback<StatsigClientEventName>;

  beforeEach(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.$on.mockImplementation((name, listener) => {
      if (name === 'experiment_evaluation') {
        emitListener = listener;
      }
      if (name === 'logs_flushed') {
        listener({ name: 'logs_flushed', events: [] });
      }
    });
    StatsigMetadataProvider.add({ isRecordingSession: undefined });
    client.getExperiment.mockImplementation((name: string) => {
      const experiment = {
        name: name,
        value: { test: '123' },
        ruleID: 'test_rule',
        groupName: 'test_group',
        details: {
          reason: '',
        },
        __evaluation: null,
        get: <T = unknown>(_param: string, fallback?: T) => {
          return fallback as TypedReturn<T>;
        },
      };
      emitListener({ name: 'experiment_evaluation', experiment });

      return experiment;
    });
  });

  it('does not start recording when wrong experiment is checked', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        passes_session_recording_targeting: true,
        session_recording_exposure_triggers: {
          4209630205: {},
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.getExperiment('abc');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('starts recording when experiment is checked and passes targeting', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        passes_session_recording_targeting: true,
        session_recording_exposure_triggers: {
          4209630205: {},
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.getExperiment('experiment');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('does not start recording when event is logged and fails targeting', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        passes_session_recording_targeting: false,
        session_recording_exposure_triggers: {
          4209630205: {},
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.getExperiment('experiment');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does not start recording when experiment is checked but groupName does not match', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        passes_session_recording_targeting: true,
        session_recording_exposure_triggers: {
          4209630205: { values: ['control_group'] },
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.getExperiment('experiment');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does not start recording when experiment is checked but does not pass sampling', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        passes_session_recording_targeting: true,
        session_recording_exposure_triggers: {
          4209630205: { passes_sampling: false },
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.getExperiment('experiment');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does start recording when experiment is checked and groupName does match', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: false,
        passes_session_recording_targeting: true,
        session_recording_exposure_triggers: {
          4209630205: { values: ['test_group'] },
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
    client.getExperiment('experiment');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  it('does not start recording if recording previously stopped', () => {
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: {
        session_recording_rate: 1,
        can_record_session: true,
        passes_session_recording_targeting: true,
        session_recording_exposure_triggers: {
          4209630205: { values: ['false'] },
        },
      },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    const replay = new TriggeredSessionReplay(client, {
      autoStartRecording: true,
    });
    let metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
    replay.stopRecording();
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('false');
    client.getExperiment('experiment');
    metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('false');
  });
});
