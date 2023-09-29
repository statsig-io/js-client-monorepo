/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';

describe('PrecomputedEvaluationsClient', () => {
  let client: PrecomputedEvaluationsClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');

    client = new PrecomputedEvaluationsClient('client-key', {});
    await client.initialize();
  });

  it('calls /initialize', () => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.statsig.com/v1/initialize',
      expect.any(Object),
    );
  });
});
