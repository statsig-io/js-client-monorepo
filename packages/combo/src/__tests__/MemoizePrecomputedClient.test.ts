import fetchMock from 'jest-fetch-mock';

import { StatsigGlobal } from '@statsig/client-core';
import { StatsigClient } from '@statsig/js-client';

import {
  anotherMockPrecomputeData,
  anotherUser,
  createTestCases,
  mockPrecomputeData,
  user,
} from './MemoizeClientTestUtils';

describe('Precomputed Client Memoization', () => {
  let client: StatsigClient;
  const setupClient = () => {
    client = new StatsigClient('client-key', user);
    client.dataAdapter.setData(JSON.stringify(mockPrecomputeData));
    client.initializeSync({ disableBackgroundCacheRefresh: true });
  };

  beforeEach(() => {
    __STATSIG__ = {} as StatsigGlobal;
    fetchMock.mockClear();
    fetchMock.enableMocks();
    setupClient();
  });

  afterEach(async () => {
    await client.shutdown();
  });

  createTestCases(false).forEach(
    ({ evalFnName, evalType, action, metadataField }) => {
      describe(`${evalFnName} Memoize`, () => {
        it('does not memoize different config names', async () => {
          action(client, `a_${evalType}`, user);
          action(client, `another_${evalType}`, user);
          await client.flush();

          const request = fetchMock.mock.calls[0];
          const body = JSON.parse(String(request[1]?.body ?? '')) as any;

          expect(body.events).toHaveLength(2);
          expect(body.events[0].user).toEqual(user);
          expect(body.events[0].metadata[metadataField]).toEqual(
            `a_${evalType}`,
          );
          expect(body.events[1].user).toEqual(user);
          expect(body.events[1].metadata[metadataField]).toEqual(
            `another_${evalType}`,
          );
        });

        it('does not log a second exposure when memoized', async () => {
          action(client, `a_${evalType}`, user);
          action(client, `a_${evalType}`, user);
          await client.flush();

          const request = fetchMock.mock.calls[0];
          const body = JSON.parse(String(request[1]?.body ?? '')) as any;

          expect(body.events).toHaveLength(1);
          expect(body.events[0].user).toEqual(user);
          expect(body.events[0].metadata[metadataField]).toEqual(
            `a_${evalType}`,
          );
        });

        it('breaks memoization when disableExposures changes', async () => {
          action(client, `a_${evalType}`, user);
          action(client, `a_${evalType}`, user, true);
          await client.flush();

          const request = fetchMock.mock.calls[0];
          const body = JSON.parse(String(request[1]?.body ?? '')) as any;

          expect(body.events).toHaveLength(2);
          expect(body.events[0].user).toEqual(user);
          expect(body.events[0].metadata[metadataField]).toEqual(
            `a_${evalType}`,
          );
          expect(body.events[1].eventName).toEqual(
            'statsig::non_exposed_checks',
          );
        });

        it('breaks memoization when the user changes', async () => {
          action(client, `a_${evalType}`, user);
          client.dataAdapter.setData(JSON.stringify(anotherMockPrecomputeData));
          client.updateUserSync(anotherUser, {
            disableBackgroundCacheRefresh: true,
          });
          action(client, `a_${evalType}`, anotherUser);
          await client.flush();

          const request = fetchMock.mock.calls[0];
          const body = JSON.parse(String(request[1]?.body ?? '')) as any;

          expect(body.events).toHaveLength(2);
          expect(body.events[1].metadata[metadataField]).toEqual(
            `a_${evalType}`,
          );
          expect(body.events[1].user).toEqual(anotherUser);
        });

        it('does not increment the non-exposed checks count when memoized', async () => {
          action(client, `a_${evalType}`, user, true);
          action(client, `a_${evalType}`, user, true);
          await client.flush();

          const request = fetchMock.mock.calls[0];
          const body = JSON.parse(String(request[1]?.body ?? '')) as any;

          expect(body.events).toHaveLength(1);
          expect(body.events[0].eventName).toEqual(
            'statsig::non_exposed_checks',
          );
          const expectedNonExposedChecks = evalType === 'layer' ? 2 : 1; // layer checks are incremented on the get function
          expect(body.events[0].metadata.checks).toEqual({
            [`a_${evalType}`]: expectedNonExposedChecks,
          });
        });
      });
    },
  );
});
