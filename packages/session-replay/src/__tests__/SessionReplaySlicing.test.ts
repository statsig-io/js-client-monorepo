import { MockRemoteServerEvalClient, anyUUID } from 'statsig-test-helpers';

import { PrecomputedEvaluationsInterface } from '@statsig/client-core';

import { SessionReplay } from '../SessionReplay';
import {
  ReplayEvent,
  ReplaySessionData,
  SessionReplayClient,
} from '../SessionReplayClient';

const DUMMY_DATA = 'a'.repeat(512 * 1024);

const SMALL_EVENT = {
  eventIndex: 0,
  type: 0,
  data: DUMMY_DATA, // 512 KB
  timestamp: 0,
};

const LARGE_EVENT = {
  eventIndex: 0,
  type: 0,
  data: DUMMY_DATA + DUMMY_DATA + DUMMY_DATA, // 1.5 MB
  timestamp: 0,
};

describe('Session Replay Force', () => {
  let client: jest.MockedObject<PrecomputedEvaluationsInterface>;
  let sessionReplay: SessionReplay;
  let replayer: SessionReplayClient;
  let emitter: (latest: ReplayEvent, data: ReplaySessionData) => void;

  async function emitEvent(event: ReplayEvent) {
    emitter(event, {
      startTime: 0,
      endTime: 0,
      clickCount: 0,
    });

    await new Promise((resolve) => setTimeout(resolve, 1)); // allow promises to resolve
  }

  beforeAll(() => {
    client = MockRemoteServerEvalClient.create();
    client.flush.mockResolvedValue();

    const ctx = {
      errorBoundary: { wrap: jest.fn() },
      values: { session_recording_rate: 1, can_record_session: true },
      session: { data: { sessionID: 'my-session-id' } },
    } as any;

    client.getContext.mockReturnValue(ctx);

    sessionReplay = new SessionReplay(client);
    replayer = (sessionReplay as any)._replayer;

    const original = replayer.record.bind(replayer);
    replayer.record = (cb: any, config: any, stopCallback: any) => {
      emitter = cb;
      return original(cb, config, stopCallback);
    };

    replayer.stop();
    sessionReplay.forceStartRecording();
  });

  beforeEach(() => {
    client.logEvent.mockClear();
  });

  it('logs a single event when below max payload size', async () => {
    await emitEvent(SMALL_EVENT);

    expect(client.logEvent).toHaveBeenCalledTimes(1);
    expect(client.flush).not.toHaveBeenCalled();
  });

  it('logs sliced events when above max payload size', async () => {
    await emitEvent(LARGE_EVENT);

    expect(client.logEvent).toHaveBeenCalledTimes(2);
    expect(client.flush).toHaveBeenCalledTimes(2);
  });

  describe('Sliced events payload', () => {
    beforeEach(async () => {
      await emitEvent(LARGE_EVENT);
    });

    it('logs the first slice with the correct metadata', () => {
      const metadata = (client.logEvent.mock.calls[0][0] as any).metadata;

      expect(metadata).toMatchObject({
        sliced_id: anyUUID(),
        slice_index: '0',
        slice_count: '2',
        slice_byte_size: '1048576',
      });
    });

    it('logs the second slice with the correct metadata', () => {
      const metadata = (client.logEvent.mock.calls[1][0] as any).metadata;

      expect(metadata).toMatchObject({
        sliced_id: anyUUID(),
        slice_index: '1',
        slice_count: '2',
        slice_byte_size: '524339',
      });
    });

    it('logs the same slice id across the two slices', () => {
      const metadata1 = (client.logEvent.mock.calls[0][0] as any).metadata;
      const metadata2 = (client.logEvent.mock.calls[1][0] as any).metadata;

      expect(metadata1.sliced_id).toEqual(metadata2.sliced_id);
    });
  });
});
