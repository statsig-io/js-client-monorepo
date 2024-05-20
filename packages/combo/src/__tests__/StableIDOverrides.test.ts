import 'jest-fetch-mock';
import {
  MockLocalStorage,
  anyObject,
  anyStringContaining,
  anyUUID,
} from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

describe('Stable ID Overrides', () => {
  let storage: MockLocalStorage;

  beforeAll(() => {
    fetchMock.enableMocks();
    storage = MockLocalStorage.enabledMockStorage();
  });

  describe('When no Override is set', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      storage.clear();

      const client = new StatsigClient(
        'client-key',
        {
          customIDs: {},
        },
        {
          disableStatsigEncoding: true,
        },
      );

      await client.initializeAsync();
      client.logEvent('my_event');

      await client.shutdown();
    });

    it('includes generated stable ids on /initialize requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/initialize'),
        anyObject(),
      );

      const [, r] = fetchMock.mock.calls[0];
      const body = JSON.parse(String(r?.body));
      expect(body).toMatchObject({
        statsigMetadata: { stableID: anyUUID() },
      });
    });

    it('includes generated stable ids on /rgstr requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/rgstr'),
        anyObject(),
      );

      const [, r] = fetchMock.mock.calls[1];
      const body = JSON.parse(String(r?.body));
      expect(body).toMatchObject({
        statsigMetadata: { stableID: anyUUID() },
      });

      expect(JSON.stringify(body.events)).toContain('customIDs":{}}');
    });

    it('persists generated stable ids to local storage', () => {
      expect(JSON.parse(storage.data['statsig.stable_id.884262860'])).toEqual(
        anyUUID(),
      );
    });
  });

  describe('When an Override is set', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      storage.clear();

      const client = new StatsigClient(
        'client-key',
        {
          customIDs: { stableID: 'custom_stable_id' },
        },
        {
          disableStatsigEncoding: true,
        },
      );

      await client.initializeAsync();
      client.logEvent('my_event');

      await client.shutdown();
    });

    it('includes custom stable ids on /initialize requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/initialize'),
        anyObject(),
      );

      const [, r] = fetchMock.mock.calls[0];
      const body = JSON.parse(String(r?.body));
      expect(body).toMatchObject({
        statsigMetadata: { stableID: 'custom_stable_id' },
      });
    });

    it('includes custom stable ids on /rgstr requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/rgstr'),
        anyObject(),
      );

      const [, r] = fetchMock.mock.calls[1];
      const body = JSON.parse(String(r?.body));
      expect(body).toMatchObject({
        statsigMetadata: { stableID: 'custom_stable_id' },
      });

      expect(JSON.stringify(body.events)).toContain(
        'customIDs":{"stableID":"custom_stable_id"}}',
      );
    });

    it('persists custom stable ids to local storage', () => {
      expect(storage.data['statsig.stable_id.884262860']).toBe(
        '"custom_stable_id"',
      );
    });
  });
});
