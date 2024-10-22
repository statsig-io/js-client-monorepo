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

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    const overrideAdapter = new LocalOverrideAdapter();
    overrideAdapter.overrideGate('partial_gate', false);
    overrideAdapter.overrideExperiment('three_groups', { a_num: 99 });
    overrideAdapter.overrideLayer('a_layer', { my_obj: { key: 'override' } });

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
});
