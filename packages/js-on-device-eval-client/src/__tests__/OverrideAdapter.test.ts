import fetchMock from 'jest-fetch-mock';
import { DcsResponseString, MockLocalStorage } from 'statsig-test-helpers';

import { LocalOverrideAdapter } from '@statsig/js-local-overrides';

import StatsigOnDeviceEvalClient from '../StatsigOnDeviceEvalClient';

describe('Override Adapter Integration', () => {
  const sdkKey = 'client-key';
  const user = { userID: 'test-user' };

  let client: StatsigOnDeviceEvalClient;
  let storageMock: MockLocalStorage;
  let overrideAdapter: LocalOverrideAdapter;

  beforeAll(async () => {
    storageMock = MockLocalStorage.enabledMockStorage();
    storageMock.clear();

    fetchMock.enableMocks();
    fetchMock.mockResponse(DcsResponseString);

    overrideAdapter = new LocalOverrideAdapter();
    overrideAdapter.overrideGate('a_gate', false);

    client = new StatsigOnDeviceEvalClient(sdkKey, {
      overrideAdapter: overrideAdapter,
    });

    await client.initializeAsync();
  });

  afterAll(() => {
    MockLocalStorage.disableMockStorage();
  });

  describe('Feature Gate Overrides', () => {
    it('should return overridden gate value via getFeatureGate', () => {
      const gate = client.getFeatureGate('a_gate', user);
      //a_gate has 100% pass %, but override should make it return false
      expect(gate.value).toBe(false);
      expect(gate.details.reason).toBe('LocalOverride:Recognized');
    });

    it('should return overridden gate value via checkGate', () => {
      const result = client.checkGate('a_gate', user);

      expect(result).toBe(false);
    });

    it('should return non-overridden gate when no override exists', () => {
      const gate = client.getFeatureGate('third_gate', user);

      // third_gate has targeting rules that aren't being met. Should return false
      expect(gate.value).toBe(false);
      expect(gate.details.reason).toBe('Network:Recognized');
    });
  });

  describe('Layer Overrides', () => {
    it('should log exposure with override rule ID', () => {
      overrideAdapter.overrideLayer('a_layer', {
        test_param: 'override_value',
      });

      const loggerSpy = jest.spyOn((client as any)._logger, 'enqueue');

      const layer = client.getLayer('a_layer', user);
      const value = layer.get('test_param');

      expect(value).toBe('override_value');
      expect(layer.details.reason).toBe('LocalOverride:Recognized');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'statsig::layer_exposure',
          metadata: expect.objectContaining({
            ruleID: expect.stringContaining('override'),
            reason: 'LocalOverride:Recognized',
          }),
        }),
      );

      loggerSpy.mockRestore();
    });

    it('should log exposure with original rule ID ', () => {
      overrideAdapter.removeLayerOverride('a_layer');

      const loggerSpy = jest.spyOn((client as any)._logger, 'enqueue');

      const layer = client.getLayer('a_layer', user);
      const value = layer.get('a_string', 'fallback');

      expect(value).toBe('Experiment Test Value');
      expect(layer.details.reason).toBe('Network:Recognized');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'statsig::layer_exposure',
          metadata: expect.objectContaining({
            reason: 'Network:Recognized',
            parameterName: 'a_string',
            config: 'a_layer',
          }),
        }),
      );

      loggerSpy.mockRestore();
    });
  });
});
