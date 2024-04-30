import { MockRemoteServerEvalClient, anyFunction } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { SessionReplay } from '../SessionReplay';

describe('Session Replay', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let shutdownListener: StatsigClientEventCallback<StatsigClientEventName>;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.__on.mockImplementation((name, listener) => {
      if (name === 'pre_shutdown') {
        shutdownListener = listener;
      }
    });
    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: { session_recording_rate: 1, can_record_session: true },
    } as any;
    client.getAsyncContext.mockReturnValue(Promise.resolve(ctx));
    client.getContext.mockReturnValue(ctx);
    new SessionReplay(client);
  });

  it('subscribes to pre_shutdown', () => {
    expect(client.__on).toHaveBeenCalledWith('pre_shutdown', anyFunction());
  });

  it('sets isRecordingSession to true', () => {
    const metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
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
