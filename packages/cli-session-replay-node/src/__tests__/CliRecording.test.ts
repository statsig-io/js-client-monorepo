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
      if (name === 'logs_flushed') {
        listener({ name: 'logs_flushed', events: [] });
      }
    });

    const mockContextHandle = {
      sdkKey: '',
      options: {},
      errorBoundary: { wrap: jest.fn() },
      values: null,
      user: { userID: '' },
      stableID: '',
      sdkInstanceID: '',
      getSession: jest.fn().mockReturnValue({
        data: { sessionID: 'test-session-id', startTime: 0, lastUpdate: 0 },
        sdkKey: '',
      }),
      toContext: jest.fn(),
    };
    client.getContextHandle.mockReturnValue(mockContextHandle as any);
    client.getContext.mockReturnValue({
      ...mockContextHandle,
      session: mockContextHandle.getSession(),
    } as any);

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
