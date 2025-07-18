import { MockRemoteServerEvalClient, anyFunction } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigClientEventCallback,
  StatsigClientEventName,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { CliRecording } from '../CliRecording';
import { CliRecordingNodeAdapterFactory } from '../CliRecordingNodeAdapter';

describe('Cli Recording', () => {
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
    CliRecording.record(client, CliRecordingNodeAdapterFactory);
  });

  it('subscribes to pre_shutdown', () => {
    expect(client.$on).toHaveBeenCalledWith('pre_shutdown', anyFunction());
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
