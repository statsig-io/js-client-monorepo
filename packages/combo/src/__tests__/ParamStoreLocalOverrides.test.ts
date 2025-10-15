import fetchMock from 'jest-fetch-mock';
import { InitResponseString } from 'statsig-test-helpers';

import {
  ParameterStore,
  StatsigClient,
  StatsigEvent,
  _DJB2,
} from '@statsig/js-client';
import { LocalOverrideAdapter } from '@statsig/js-local-overrides';

describe('Parameter Stores - Local Overrides', () => {
  let client: StatsigClient;
  let store: ParameterStore;
  let events: StatsigEvent[] = [];
  let overrideAdapter: LocalOverrideAdapter;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    overrideAdapter = new LocalOverrideAdapter();
    overrideAdapter.overrideGate('partial_gate', false); // 610600137
    overrideAdapter.overrideExperiment('three_groups', { a_num: 99 }); // 2493531029
    overrideAdapter.overrideLayer('a_layer', { my_obj: { key: 'override' } }); // 3011030003

    client = new StatsigClient(
      'client-key',
      { userID: 'a-user' },
      { overrideAdapter },
    );
    await client.initializeAsync();

    fetchMock.mockImplementation(async (url, payload) => {
      if (!url?.toString().includes('/rgstr')) {
        return Promise.resolve(new Response());
      }

      const body = JSON.parse(String(payload?.body ?? '{}'));
      events.push(
        ...body.events.filter((e: StatsigEvent) =>
          e.eventName.includes('_exposure'),
        ),
      );
      return Promise.resolve(new Response());
    });

    store = client.getParameterStore('a_param_store');
  });

  describe('mapped gate params', () => {
    let result: string;

    beforeAll(async () => {
      events = [];

      result = store.get('a_string_param', 'fallback');
      await client.flush();
    });

    it('gets the correct value', async () => {
      expect(result).toEqual('Nah');
    });

    it('logs a gate exposure event', () => {
      expect(events[0].eventName).toEqual('statsig::gate_exposure');
      expect(events[0].metadata?.['gate']).toEqual(_DJB2('partial_gate'));
      expect(events[0].metadata?.['reason']).toEqual(
        'LocalOverride:Recognized',
      );
    });
  });

  describe('mapped experiment params', () => {
    let result: number;

    beforeAll(async () => {
      events = [];

      result = store.get('a_num_param', -1);
      await client.flush();
    });

    it('gets the correct value', async () => {
      expect(result).toBe(99);
    });

    it('logs a gate exposure event', () => {
      expect(events[0].eventName).toEqual('statsig::config_exposure');
      expect(events[0].metadata?.['config']).toEqual(_DJB2('three_groups'));
      expect(events[0].metadata?.['reason']).toEqual(
        'LocalOverride:Recognized',
      );
    });
  });

  describe('mapped layer params', () => {
    let result: object;

    beforeAll(async () => {
      events = [];

      result = store.get('an_object_param', { key: 'fallback' });
      await client.flush();
    });

    it('gets the correct value', async () => {
      expect(result).toEqual({ key: 'override' });
    });

    it('logs a gate exposure event', () => {
      expect(events[0].eventName).toEqual('statsig::layer_exposure');
      expect(events[0].metadata?.['config']).toEqual(_DJB2('a_layer'));
      expect(events[0].metadata?.['reason']).toEqual(
        'LocalOverride:Recognized',
      );
    });
  });

  afterAll(async () => {
    overrideAdapter.removeAllOverrides();
    await client.shutdown();
  });
});

describe('Static overrides of whole param store', () => {
  let client: StatsigClient;
  let overrideAdapter: LocalOverrideAdapter;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    overrideAdapter = new LocalOverrideAdapter();
    overrideAdapter.overrideParamStore('a_param_store', {
      a_string_param: 'override',
      a_num_param: 99,
      an_object_param: { key: 'override' },
    });

    client = new StatsigClient(
      'client-key',
      { userID: 'a-user' },
      { overrideAdapter },
    );
    await client.initializeAsync();
  });

  it('gets the value that we just overrode', () => {
    const paramStore = client.getParameterStore('a_param_store');
    const string_result = paramStore.get('a_string_param', 'fallback');
    const num_result = paramStore.get('a_num_param', -1);
    const object_result = paramStore.get('an_object_param', {
      key: 'fallback',
    });

    expect(string_result).toEqual('override');
    expect(num_result).toEqual(99);
    expect(object_result).toEqual({ key: 'override' });
  });

  it('Does not change values that we did not override', () => {
    const paramStore = client.getParameterStore('a_param_store');
    const bool_result = paramStore.get('a_bool_param', true);
    const array_result = paramStore.get('an_array_param', ['test_entry']);
    const another_string_result = paramStore.get(
      'another_string_param',
      'fallback',
    );
    const unrecognized_object_result = paramStore.get(
      'unrecognized_object_param',
      { key: 'fallback' },
    );

    expect(bool_result).toEqual(false);
    expect(array_result).toEqual([]);
    expect(another_string_result).toEqual('#FF0000');
    expect(unrecognized_object_result).toEqual({ key: 'fallback' });
  });

  afterAll(async () => {
    overrideAdapter.removeAllOverrides();
    await client.shutdown();
  });
});

describe('Static overrides of whole param store', () => {
  let client: StatsigClient;
  let overrideAdapter: LocalOverrideAdapter;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    overrideAdapter = new LocalOverrideAdapter();
    overrideAdapter.overrideParamStore('a_param_store', {
      a_string_param: 'override',
      a_num_param: 99,
      an_object_param: { key: 'override' },
    });

    client = new StatsigClient(
      'client-key',
      { userID: 'a-user' },
      { overrideAdapter },
    );
    await client.initializeAsync();

    overrideAdapter.removeParamStoreOverride('a_param_store');
  });

  it('Does not change values after overrides are removed', () => {
    const paramStore = client.getParameterStore('a_param_store');
    const string_result = paramStore.get('a_string_param', 'fallback');
    const num_result = paramStore.get('a_num_param', -1);
    const object_result = paramStore.get('an_object_param', {
      key: 'fallback',
    });
    const bool_result = paramStore.get('a_bool_param', true);
    const array_result = paramStore.get('an_array_param', ['test_entry']);
    const another_string_result = paramStore.get(
      'another_string_param',
      'fallback',
    );
    const unrecognized_object_result = paramStore.get(
      'unrecognized_object_param',
      { key: 'fallback' },
    );

    expect(string_result).toEqual('Yea');
    expect(num_result).toEqual(2);
    expect(object_result).toEqual({});
    expect(bool_result).toEqual(false);
    expect(array_result).toEqual([]);
    expect(another_string_result).toEqual('#FF0000');
    expect(unrecognized_object_result).toEqual({ key: 'fallback' });
  });

  afterAll(async () => {
    overrideAdapter.removeAllOverrides();
    await client.shutdown();
  });
});
