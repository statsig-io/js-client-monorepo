/**
 * @jest-environment jsdom
 */

import fetchMock from 'jest-fetch-mock';
import StatsigRemoteServerEvalClient from '../StatsigRemoteServerEvalClient';

describe('StatsigRemoteServerEvalClient', () => {
  let client: StatsigRemoteServerEvalClient;

  beforeAll(async () => {
    fetchMock.enableMocks();
    fetchMock.mockResponse('{}');

    client = new StatsigRemoteServerEvalClient('client-key', {});
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
