import fetchMock from 'jest-fetch-mock';

import { configureErrorBoundary } from '@sigstat/core';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import InitializeResponse from './initialize.json';

describe('Client Error Boundary', () => {
  let client: PrecomputedEvaluationsClient;

  beforeAll(async () => {
    client = new PrecomputedEvaluationsClient('client-key', { userID: '' });
    configureErrorBoundary({
      isSilent: true, // todo: replace with StatsigOptions.logLevel
      metadata: {},
      sdkKey: 'client-key',
    });

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    await client.initialize();
  });

  it('catches errors', () => {
    (client as any)._logger = 1;
    expect(() => client.checkGate('test_public')).not.toThrow();
  });
});
