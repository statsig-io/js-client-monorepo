import fetchMock from 'jest-fetch-mock';

import PrecomputedEvaluationsClient from '../PrecomputedEvaluationsClient';

describe('PrecomputedEvaluationsClient', () => {
  let client: PrecomputedEvaluationsClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');

    client = new PrecomputedEvaluationsClient('client-key', { userID: '' });
    await client.initialize();

    client.getExperiment('');
  });

  it('calls /initialize', () => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://api.statsig.com/v1/initialize?k=client-key&st=js-precomputed-evaluations-client',
      ),
      expect.any(Object),
    );
  });
});
