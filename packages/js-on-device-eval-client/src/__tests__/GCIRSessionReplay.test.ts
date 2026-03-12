import fetchMock from 'jest-fetch-mock';

import StatsigOnDeviceEvalClient from '../StatsigOnDeviceEvalClient';

function makeDcsResponse(session_replay_info: unknown) {
  return {
    dynamic_configs: [],
    feature_gates: [
      {
        name: 'fail_gate',
        type: 'feature_gate',
        salt: '',
        enabled: true,
        defaultValue: false,
        rules: [],
        idType: 'userID',
        entity: 'feature_gate',
        explicitParameters: null,
        hasSharedParams: false,
        targetAppIDs: [],
      },
      {
        name: 'pass_gate',
        type: 'feature_gate',
        salt: '',
        enabled: true,
        defaultValue: false,
        rules: [
          {
            name: 'everyone',
            passPercentage: 100,
            conditions: [
              {
                type: 'public',
                targetValue: null,
                operator: null,
                field: null,
                additionalValues: {},
                idType: 'userID',
              },
            ],
            returnValue: true,
            id: 'pass_gate',
            salt: '123',
            idType: 'userID',
          },
        ],
        idType: 'userID',
        entity: 'feature_gate',
        explicitParameters: null,
        hasSharedParams: false,
        targetAppIDs: [],
      },
    ],
    layer_configs: [],
    has_updates: true,
    time: 1646425699558,
    sdk_keys_to_app_ids: {},
    session_replay_info,
  };
}

describe('GCIR Session Replay', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'a-user' };

  let client: StatsigOnDeviceEvalClient;

  beforeEach(async () => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
    client = new StatsigOnDeviceEvalClient(sdkKey);
  });

  it('returns no session replay fields when session_replay_info is missing', async () => {
    fetchMock.mockResponse(JSON.stringify(makeDcsResponse(undefined)));
    await client.initializeAsync();

    const resp = client.getClientInitializeResponse(user, { hash: 'djb2' });
    expect(resp).not.toBeNull();
    expect(resp).toMatchObject({
      // sanity check - we got a real init response
      has_updates: true,
      hash_used: 'djb2',
    });

    const r = resp as any;
    expect(r.recording_blocked).toBeUndefined();
    expect(r.can_record_session).toBeUndefined();
    expect(r.passes_session_recording_targeting).toBeUndefined();
    expect(r.session_recording_rate).toBeUndefined();
    expect(r.session_recording_event_triggers).toBeUndefined();
    expect(r.session_recording_exposure_triggers).toBeUndefined();
  });

  it('formats can_record_session, targeting, and triggers like Kong expects', async () => {
    fetchMock.mockResponse(
      JSON.stringify(
        makeDcsResponse({
          recording_blocked: false,
          sampling_rate: 1,
          targeting_gate: 'pass_gate',
          session_recording_event_triggers: {
            event1: {},
            event2: { values: ['value1', 'value2'] },
            event3: { values: ['value3'], sampling_rate: 0 },
            event4: { values: ['value4'], sampling_rate: 1 },
          },
          session_recording_exposure_triggers: {
            fail_gate: {},
            pass_gate: { values: ['true'] },
            other_gate: { values: ['false'], sampling_rate: 0 },
            other_gate2: { values: ['true'], sampling_rate: 1 },
          },
        }),
      ),
    );
    await client.initializeAsync();

    const resp = client.getClientInitializeResponse(user, {
      hash: 'djb2',
    }) as any;
    expect(resp).toBeTruthy();

    expect(resp.recording_blocked).toEqual(false);
    expect(resp.can_record_session).toEqual(true);
    expect(resp.passes_session_recording_targeting).toEqual(true);
    expect(resp.session_recording_rate).toEqual(1);

    expect(resp.session_recording_event_triggers).toEqual({
      event1: {},
      event2: { values: ['value1', 'value2'] },
      event3: { values: ['value3'], passes_sampling: false },
      event4: { values: ['value4'], passes_sampling: true },
    });

    // These are the djb2 hashes Kong asserts for the raw gate names.
    expect(resp.session_recording_exposure_triggers).toEqual({
      '3753570636': {},
      '3344401465': { values: ['true'] },
      '4112347290': { values: ['false'], passes_sampling: false },
      '2928714456': { values: ['true'], passes_sampling: true },
    });
  });
});
