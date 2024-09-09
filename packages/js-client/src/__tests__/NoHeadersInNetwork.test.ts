import fetchMock from 'jest-fetch-mock';

import StatsigClient from '../StatsigClient';

// Headers cause 'preflight' requests in Browsers. Wasting time on a network roundtrips.
describe('No Headers in Network Requests', () => {
  beforeAll(async () => {
    fetchMock.enableMocks();

    const client = new StatsigClient('client-key', {});
    await client.initializeAsync();
    client.logEvent('my_event');
    await client.flush();
  });

  it('made two requests', () => {
    expect(fetchMock.mock.calls).toHaveLength(2);
  });

  it('does not include headers on /initialize', () => {
    const [url, args] = fetchMock.mock.calls[0];
    expect(url).toContain('https://featureassets.org/v1/initialize');
    expect(args?.headers).toBeDefined();
  });

  it('does not include headers on /rgstr', () => {
    const [url, args] = fetchMock.mock.calls[1];
    expect(url).toContain('https://prodregistryv2.org/v1/rgstr');
    expect(args?.headers).toBeDefined();
  });
});
