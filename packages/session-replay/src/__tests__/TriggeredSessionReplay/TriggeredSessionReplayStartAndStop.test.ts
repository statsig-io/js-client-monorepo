import { MockRemoteServerEvalClient } from 'statsig-test-helpers';

import {
  PrecomputedEvaluationsInterface,
  StatsigMetadataProvider,
} from '@statsig/client-core';

import { TriggeredSessionReplay } from '../../TriggeredSessionReplay';
import { mockClientContext } from '../../testUtils/mockClientContext';

describe('Triggered Session Replay Start and Stop', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let sessionReplay: TriggeredSessionReplay;

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();
    client.$on.mockImplementation((name, listener) => {
      if (name === 'logs_flushed') {
        listener({ name: 'logs_flushed', events: [] });
      }
    });
    mockClientContext(client, {
      session_recording_rate: 1,
      can_record_session: true,
    });
    sessionReplay = new TriggeredSessionReplay(client);
    sessionReplay.startRecording();
  });

  it('Starts recording when start called', () => {
    const metadata = StatsigMetadataProvider.get() as any;
    expect(metadata.isRecordingSession).toBe('true');
  });

  describe('when stop is called', () => {
    beforeAll(async () => {
      sessionReplay.stopRecording();
    });

    it('sets isRecordingSession to false', () => {
      const metadata = StatsigMetadataProvider.get() as any;
      expect(metadata.isRecordingSession).toBe('false');
    });
  });
});
