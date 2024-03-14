import fetchMock from 'jest-fetch-mock';

import StatsigClient from '../StatsigClient';

describe('StatsigClient', () => {
  let client: StatsigClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');

    client = new StatsigClient('client-key', { userID: '' });
    client.initializeSync();

    client.getExperiment('');
  });

  it('calls /initialize', () => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://api.statsig.com/v1/initialize?k=client-key&st=javascript-client',
      ),
      expect.any(Object),
    );
  });
});
