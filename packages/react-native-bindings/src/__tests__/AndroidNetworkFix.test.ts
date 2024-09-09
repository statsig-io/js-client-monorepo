import fetchMock from 'jest-fetch-mock';

import { StatsigGlobal } from '@statsig/client-core';

import { StatsigClientRN } from '../StatsigClientRN';

describe('RN - Network Fix', () => {
  beforeAll(async () => {
    fetchMock.enableMocks();
  });

  describe('when fix is applied', () => {
    beforeAll(async () => {
      __STATSIG__ = {} as StatsigGlobal;
      fetchMock.mock.calls = [];

      const client = new StatsigClientRN('client-key', {});
      await client.initializeAsync();
      client.logEvent('my_event');
      await client.flush();
    });

    it('made two requests', () => {
      expect(fetchMock.mock.calls).toHaveLength(2);
    });

    it('included Content-Type on /initialize', () => {
      const [url, args] = fetchMock.mock.calls[0];
      expect(url).toContain('https://featureassets.org/v1/initialize');
      expect(args?.headers).toMatchObject({
        'Content-Type': 'application/json',
      });
    });

    it('included Content-Type on /rgstr', () => {
      const [url, args] = fetchMock.mock.calls[1];
      expect(url).toContain('https://prodregistryv2.org/v1/rgstr');
      expect(args?.headers).toMatchObject({
        'Content-Type': 'application/json',
      });
    });
  });

  describe('when fix is overridden', () => {
    beforeAll(async () => {
      __STATSIG__ = {} as StatsigGlobal;
      fetchMock.mock.calls = [];

      const client = new StatsigClientRN(
        'client-key',
        {},
        { networkConfig: { networkOverrideFunc: fetch } },
      );
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
});
