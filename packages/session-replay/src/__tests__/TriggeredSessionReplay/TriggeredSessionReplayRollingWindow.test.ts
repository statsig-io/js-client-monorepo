import { MockRemoteServerEvalClient, anyFunction } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay With Auto Record', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let sessionReplay: TriggeredSessionReplay;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: true,
    });
    sessionReplay = new TriggeredSessionReplay(client, {
      keepRollingWindow: true,
    });
  });

  it('subscribes to pre_shutdown', () => {
    expect(client.$on).toHaveBeenCalledWith('pre_shutdown', anyFunction());
  });

  it('does not set is recording during rolling window', () => {
    const metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe(undefined);
  });

  it('does start recording when rolling window is started', () => {
    expect(sessionReplay.isRecording()).toBe(true);
  });
});
