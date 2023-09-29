/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';

import PrecomputedEvalutationsClient from '../PrecomputedEvalutationsClient';

describe('PrecomputedEvalutationsClient', () => {
  let client: PrecomputedEvalutationsClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');

    client = new PrecomputedEvalutationsClient('client-key', {});
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
