import { MockRemoteServerEvalClient, anyFunction } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
  _notifyVisibilityChanged,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';

describe('Triggered Session Replay No Auto Record', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let shutdownListener: StatsigClientEventCallback<StatsigClientEventName>;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.$on.mockImplementation((name, listener) => {
      if (name === 'pre_shutdown') {
        shutdownListener = listener;
      }
    });
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: { session_recording_rate: 1, can_record_session: true },
      session: { data: { sessionID: '' } },
    } as any;
    client.getContext.mockReturnValue(ctx);
    new TriggeredSessionReplay(client);
  });

  it('subscribes to pre_shutdown', () => {
    expect(client.$on).toHaveBeenCalledWith('pre_shutdown', anyFunction());
  });

  it('does not automatically start recording', () => {
    const metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('adds events on backgrounding', () => {
    client.flush.mock.calls = [];
    _notifyVisibilityChanged('background');
    expect(client.flush).toHaveBeenCalled();
  });

  describe('when shutdown', () => {
    beforeAll(async () => {
      shutdownListener({ name: 'pre_shutdown' });
    });

    it('sets isRecordingSession to false', () => {
      const metadata = StatsigMetadataProvider.get() as any;
      expect(metadata.isRecordingSession).toBe('false');
    });
  });
});
