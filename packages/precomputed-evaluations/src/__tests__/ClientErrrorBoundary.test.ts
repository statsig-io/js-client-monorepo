/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';
import InitializeResponse from './initialize.json';

describe('Client Error Boundary', () => {
  let client: PrecomputedEvaluationsClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse(JSON.stringify(InitializeResponse));

    client = new PrecomputedEvaluationsClient('client-key', {});
    await client.initialize();
  });

  it('catches errors', () => {
    (client as any)._logger = 1;
    expect(() => client.checkGate('test_public')).not.toThrow();
  });
});
