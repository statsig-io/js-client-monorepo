import fetchMock from 'jest-fetch-mock';

import { _getStatsigGlobal } from '@statsig/client-core';

import { version } from '../../package.json';
import StatsigClient from '../StatsigClient';

describe('StatsigMetadata', () => {
  let body: Record<string, unknown>;

  beforeAll(async () => {
    __STATSIG__ = { ..._getStatsigGlobal(), 'no-encode': 1 };
    fetchMock.mockResponse('{}');

    const client = new StatsigClient('client-key', { userID: '' });
    await client.initializeAsync();

    const data = fetchMock.mock.calls?.[0]?.[1]?.body?.toString() ?? '{}';
    body = JSON.parse(data) as Record<string, unknown>;
  });

  it('has the correct sdkType', () => {
    expect(body['statsigMetadata']).toMatchObject({
      sdkType: 'javascript-client',
    });
  });

  it('has the correct sdkVersion', () => {
    expect(body['statsigMetadata']).toMatchObject({
      sdkVersion: version as string,
    });
  });
});
