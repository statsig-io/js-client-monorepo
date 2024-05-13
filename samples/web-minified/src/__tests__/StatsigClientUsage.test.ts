import 'jest-fetch-mock';
import {
  InitResponseString,
  MockLocalStorage,
  anyString,
} from 'statsig-test-helpers';

import type { StatsigClient } from '@statsig/js-client';

import StatsigMin from '../assets/statsig-js-client.min.js';

describe('Minified StatsigClient', () => {
  let client: StatsigClient;
  let storage: MockLocalStorage;

  beforeAll(async () => {
    storage = MockLocalStorage.enabledMockStorage();

    fetchMock.enableMocks();
    fetchMock.mockResponse(InitResponseString);

    const StatsigClientMin = StatsigMin.StatsigClient as typeof StatsigClient;
    client = new StatsigClientMin('client-key', { userID: 'a-user' });

    await client.initializeAsync();
  });

  it('hits initialize', () => {
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/initialize');
  });

  it('gets gate results', () => {
    const gate = client.checkGate('a_gate');
    expect(gate).toBe(true);
  });

  it('flushes events', async () => {
    client.logEvent('my_custom_event');
    await client.flush();
    const [url, request] = fetchMock.mock.lastCall ?? [];

    expect(url).toContain('/v1/rgstr');
    expect(request?.body).toContain('"eventName":"my_custom_event"');
  });

  it('writes to stable id to cache', () => {
    expect(storage.data['statsig.stable_id.884262860']).toEqual(anyString());
  });

  it('writes to session id to cache', () => {
    expect(storage.data['statsig.session_id.884262860']).toEqual(anyString());
  });

  it('writes to values to cache', () => {
    expect(storage.data['statsig.cached.evaluations.1769418430']).toEqual(
      anyString(),
    );
  });
});
