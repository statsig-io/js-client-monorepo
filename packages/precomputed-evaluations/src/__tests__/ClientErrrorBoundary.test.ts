import fetchMock from 'jest-fetch-mock';

import { LogLevel } from '@statsig/client-core';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import InitializeResponse from './initialize.json';

describe('Client Error Boundary', () => {
  let client: PrecomputedEvaluationsClient;

  beforeAll(async () => {
    client = new PrecomputedEvaluationsClient(
      'client-key',
      { userID: '' },
      {
        logLevel: LogLevel.None,
      },
    );

    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));
    client.initializeSync();
  });

  it('catches errors', () => {
    (client as any)._logger = 1;
    expect(() => client.checkGate('test_public')).not.toThrow();
  });
});
