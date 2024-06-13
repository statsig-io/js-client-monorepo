import 'jest-fetch-mock';
import {
  MockLocalStorage,
  anyObject,
  anyStringContaining,
  anyUUID,
} from 'statsig-test-helpers';

import { StatsigClient } from '@statsig/js-client';

describe('Session ID Override Initial', () => {
  let storage: MockLocalStorage;

  beforeAll(() => {
    fetchMock.enableMocks();
    storage = MockLocalStorage.enabledMockStorage();
  });

  describe('When no override is set', () => {
    beforeAll(async () => {
      fetchMock.mockClear();
      storage.clear();

      const client = new StatsigClient('client-key', {});

      await client.initializeAsync();
      client.logEvent('my_event');

      await client.shutdown();
    });

    it('includes generated session ids on /initialize requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/initialize'),
        anyObject(),
      );

      const [u] = fetchMock.mock.calls[1];
      const params = new URLSearchParams(String(u));
      expect(params.get('sid')).toEqual(anyUUID());
    });

    it('includes generated session ids on /rgstr requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/rgstr'),
        anyObject(),
      );

      const [u] = fetchMock.mock.calls[1];
      const params = new URLSearchParams(String(u));
      expect(params.get('sid')).toEqual(anyUUID());
    });

    it('persists generated session ids to local storage', () => {
      expect(
        JSON.parse(storage.data['statsig.session_id.884262860']).sessionID,
      ).toEqual(anyUUID());
    });
  });

  describe('When an override is set', () => {
    let client: StatsigClient;

    beforeAll(async () => {
      fetchMock.mockClear();
      storage.clear();

      client = new StatsigClient(
        'client-key',
        {},
        {
          initialSessionID: 'my-session-id',
        },
      );

      await client.initializeAsync();
      client.logEvent('my_event');

      await client.shutdown();
    });

    it('includes custom session ids on /initialize requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/initialize'),
        anyObject(),
      );

      const [u] = fetchMock.mock.calls[1];
      const params = new URLSearchParams(String(u));
      expect(params.get('sid')).toBe('my-session-id');
    });

    it('includes custom session ids on /rgstr requests', () => {
      expect(fetchMock).toHaveBeenCalledWith(
        anyStringContaining('/v1/rgstr'),
        anyObject(),
      );

      const [u] = fetchMock.mock.calls[1];
      const params = new URLSearchParams(String(u));
      expect(params.get('sid')).toBe('my-session-id');
    });

    it('persists initial session ids to local storage', () => {
      expect(
        JSON.parse(storage.data['statsig.session_id.884262860']).sessionID,
      ).toBe('my-session-id');
    });

    it('expires custom session ids', async () => {
      Date.now = () => Number.MAX_SAFE_INTEGER;
      expect((await client.getAsyncContext()).session.data.sessionID).toEqual(
        anyUUID(),
      );
    });
  });
});
