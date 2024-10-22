import fetchMock from 'jest-fetch-mock';

import {
  AnyStatsigClientEvent,
  DynamicConfig,
  FeatureGate,
  Layer,
} from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';
import { LocalOverrideAdapter } from '@statsig/js-local-overrides';

describe('Local Overrides - StatsigClient', () => {
  const user = { userID: 'a-user' };

  let client: StatsigClient;
  let overrideAdapter: LocalOverrideAdapter;
  let emissions: AnyStatsigClientEvent[];

  beforeAll(() => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');

    overrideAdapter = new LocalOverrideAdapter();
    client = new StatsigClient('client-key', user, { overrideAdapter });

    client.on('*', (event) => {
      if (event.name.endsWith('_evaluation')) {
        emissions.push(event);
      }
    });

    client.initializeSync();
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  describe('FeatureGate Overrides', () => {
    let gate: FeatureGate;

    beforeAll(() => {
      fetchMock.mock.calls = [];
      emissions = [];

      overrideAdapter.overrideGate('a_gate', true);
      gate = client.getFeatureGate('a_gate');

      void client.flush();
    });

    it('got the overridden value', () => {
      expect(gate.value).toBe(true);
    });

    it('has the eval reason to "LocalOverride"', () => {
      expect(gate.details.reason).toBe('LocalOverride:Recognized');
    });

    it('emits the correct client event', () => {
      const emission = emissions[0] as any;
      expect(emission.name).toBe('gate_evaluation');
      expect(emission.gate.details.reason).toBe('LocalOverride:Recognized');
      expect(emission.gate.value).toBe(true);
    });

    it('logged an event with reason set to "LocalOverride"', () => {
      const [url, payload] = fetchMock.mock.calls[0];
      expect(url).toContain('https://prodregistryv2.org/v1/rgstr');

      const body = JSON.parse(String(payload?.body)) as any;
      const event = body.events[0];
      expect(event.metadata.gate).toBe('a_gate');
      expect(event.metadata.reason).toBe('LocalOverride:Recognized');
    });
  });

  describe('DynamicConfig Overrides', () => {
    let config: DynamicConfig;

    beforeAll(() => {
      fetchMock.mock.calls = [];
      emissions = [];

      overrideAdapter.overrideDynamicConfig('a_config', { a_string: 'foo' });
      config = client.getDynamicConfig('a_config');

      void client.flush();
    });

    it('got the overridden value', () => {
      expect(config.value).toEqual({ a_string: 'foo' });
    });

    it('has the eval reason to "LocalOverride"', () => {
      expect(config.details.reason).toBe('LocalOverride:Recognized');
    });

    it('emits the correct client event', () => {
      const emission = emissions[0] as any;
      expect(emission.name).toBe('dynamic_config_evaluation');
      expect(emission.dynamicConfig.details.reason).toBe(
        'LocalOverride:Recognized',
      );
      expect(emission.dynamicConfig.value).toEqual({ a_string: 'foo' });
    });

    it('logged an event with reason set to "LocalOverride"', () => {
      const [url, payload] = fetchMock.mock.calls[0];
      expect(url).toContain('https://prodregistryv2.org/v1/rgstr');

      const body = JSON.parse(String(payload?.body)) as any;
      const event = body.events[0];
      expect(event.metadata.config).toBe('a_config');
      expect(event.metadata.reason).toBe('LocalOverride:Recognized');
    });
  });

  describe('Layer Overrides', () => {
    let layer: Layer;
    let layerValue: unknown;

    beforeAll(() => {
      fetchMock.mock.calls = [];
      emissions = [];

      overrideAdapter.overrideLayer('a_layer', { a_string: 'foo' });
      layer = client.getLayer('a_layer');
      layerValue = layer.get('a_string');

      void client.flush();
    });

    it('got the overridden value', () => {
      expect(layerValue).toEqual('foo');
    });

    it('has the eval reason to "LocalOverride"', () => {
      expect(layer.details.reason).toBe('LocalOverride:Recognized');
    });

    it('emits the correct client event', () => {
      const emission = emissions[0] as any;
      expect(emission.name).toBe('layer_evaluation');
      expect(emission.layer.details.reason).toBe('LocalOverride:Recognized');
      expect(emission.layer.__value).toEqual({ a_string: 'foo' });
    });

    it('logged an event with reason set to "LocalOverride"', () => {
      const [url, payload] = fetchMock.mock.calls[0];
      expect(url).toContain('https://prodregistryv2.org/v1/rgstr');

      const body = JSON.parse(String(payload?.body)) as any;
      const event = body.events[0];
      expect(event.metadata.config).toBe('a_layer');
      expect(event.metadata.reason).toBe('LocalOverride:Recognized');
    });
  });
});
