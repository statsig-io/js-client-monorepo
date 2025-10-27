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
});
